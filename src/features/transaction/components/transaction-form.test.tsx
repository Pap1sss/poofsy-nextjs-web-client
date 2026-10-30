import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { onboardedAuth, transaction } from "@/test/fixtures";
import { ok, pickerHandlers } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { TransactionForm } from "./transaction-form";

// The combobox popup is covered in components/shared; a native <select> exercises the same props here.
vi.mock("@/components/shared/autocomplete", () => ({
  Autocomplete: ({
    id,
    value,
    onChange,
    options,
    placeholder,
    invalid,
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    invalid?: boolean;
  }) => (
    <select id={id} value={value} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

beforeEach(() => {
  // Only Date: user-event still needs real timers. Oct 21, 10:00 in Manila.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T02:00:00Z"));
  server.use(...pickerHandlers);
});

afterEach(() => vi.useRealTimers());

const open = (props: Partial<Parameters<typeof TransactionForm>[0]> = {}) => {
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  const view = renderWithProviders(
    <TransactionForm open onOpenChange={onOpenChange} onSaved={onSaved} {...props} />,
    { auth: onboardedAuth() }
  );
  return { ...view, onOpenChange, onSaved, dialog: within(screen.getByRole("dialog")) };
};

const pickType = (user: ReturnType<typeof open>["user"], type: RegExp) =>
  user.click(screen.getByRole("radio", { name: type }));

const waitForPickers = () =>
  waitFor(() => expect(screen.getByRole("option", { name: "Cash on hand" })).toBeInTheDocument());

describe("TransactionForm validation", () => {
  it("asks for a category on an expense and a positive amount", async () => {
    const { user } = open();
    await waitForPickers();

    await user.type(screen.getByLabelText("Amount"), "0");
    await user.type(screen.getByLabelText("Description"), "Groceries");
    await user.selectOptions(screen.getByLabelText("Paid from"), "acc-wallet");
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(await screen.findByText("The amount must be more than zero.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category for this expense.")).toBeInTheDocument();
  });

  it("asks where a transfer goes, and offers only savings categories", async () => {
    const { user } = open();
    await waitForPickers();
    await pickType(user, /^Transfer/);

    await user.type(screen.getByLabelText("Amount"), "1000");
    await user.type(screen.getByLabelText("Description"), "Savings");
    await user.selectOptions(screen.getByLabelText("From account"), "acc-wallet");
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(await screen.findByText("Choose where the money goes.")).toBeInTheDocument();

    const category = within(screen.getByLabelText("Savings or investment category"));
    expect(category.getByRole("option", { name: "MariBank" })).toBeInTheDocument();
    expect(category.queryByRole("option", { name: "Food Allowance" })).not.toBeInTheDocument();
    // The from-account can't also be the destination.
    expect(
      within(screen.getByLabelText("To account")).queryByRole("option", { name: "Cash on hand" })
    ).not.toBeInTheDocument();
  });

  it("hides archived accounts from a new transaction", async () => {
    open();
    await waitForPickers();

    expect(screen.queryByRole("option", { name: "Old wallet" })).not.toBeInTheDocument();
  });

  it("puts a 422 from the API on the matching field", async () => {
    server.use(
      http.post("*/api/transactions", () =>
        HttpResponse.json(
          {
            success: false,
            message: "Expenses need a spending category. Record savings as a transfer instead.",
            errors: {
              category_id: [
                "Expenses need a spending category. Record savings as a transfer instead.",
              ],
            },
          },
          { status: 422 }
        )
      )
    );
    const { user } = open();
    await waitForPickers();

    await user.type(screen.getByLabelText("Amount"), "100");
    await user.type(screen.getByLabelText("Description"), "Lunch");
    await user.selectOptions(screen.getByLabelText("Paid from"), "acc-wallet");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    expect(await screen.findByText(/Expenses need a spending category/)).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("TransactionForm saving", () => {
  it("creates an expense with a decimal-string amount and refreshes the ledger", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/transactions", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok(
          transaction({ amount: { amount: "1250.50", currency: "PHP" } }),
          "Transaction saved."
        );
      })
    );
    const { user, queryClient, onSaved, onOpenChange } = open();
    for (const key of ["transactions", "accounts", "budgets"])
      queryClient.setQueryData([key, "seed"], {});
    await waitForPickers();

    await user.type(screen.getByLabelText("Amount"), "1,250.50");
    await user.type(screen.getByLabelText("Description"), "  Groceries  ");
    await user.selectOptions(screen.getByLabelText("Paid from"), "acc-wallet");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.selectOptions(screen.getByLabelText("Payment method"), "pm-gcash");
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toEqual({
      type: "expense",
      amount: "1250.50",
      account_id: "acc-wallet",
      to_account_id: null,
      category_id: "cat-food",
      payment_method_id: "pm-gcash",
      adjustment_direction: null,
      exclude_from_budget: false,
      transaction_date: "2026-10-21",
      description: "Groceries",
      notes: null,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    for (const key of ["transactions", "accounts", "budgets"]) {
      expect(queryClient.getQueryState([key, "seed"])?.isInvalidated).toBe(true);
    }
  });

  it("sends a track-only expense with no account, and offers it only for expenses", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/transactions", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok(transaction({ account: null }), "Transaction saved.");
      })
    );
    const { user, onSaved } = open();
    await waitForPickers();

    await user.type(screen.getByLabelText("Amount"), "80");
    await user.type(screen.getByLabelText("Description"), "Coffee a friend paid for");
    await user.selectOptions(screen.getByLabelText("Paid from"), "none");
    expect(screen.getByText(/no account balance changes/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toMatchObject({ type: "expense", account_id: null });

    await pickType(user, /^Income/);
    expect(
      within(screen.getByLabelText("Received in")).queryByRole("option", {
        name: "None – track only",
      })
    ).not.toBeInTheDocument();
  });

  it("keeps an expense out of the Payday Planner, and offers that only for expenses", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/transactions", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok(transaction({ exclude_from_budget: true }), "Transaction saved.");
      })
    );
    const { user, onSaved } = open();
    await waitForPickers();

    await user.type(screen.getByLabelText("Amount"), "15000");
    await user.type(screen.getByLabelText("Description"), "Phone from savings");
    await user.selectOptions(screen.getByLabelText("Paid from"), "acc-wallet");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.click(screen.getByLabelText("Don't count in Payday Planner"));
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toMatchObject({ type: "expense", exclude_from_budget: true });

    await pickType(user, /^Transfer/);
    expect(screen.queryByLabelText("Don't count in Payday Planner")).not.toBeInTheDocument();
  });

  it("sends a transfer with its destination and savings tag", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/transactions", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok(transaction({ type: "transfer" }), "Transaction saved.");
      })
    );
    const { user, onSaved } = open();
    await waitForPickers();
    await pickType(user, /^Transfer/);

    await user.type(screen.getByLabelText("Amount"), "500");
    await user.type(screen.getByLabelText("Description"), "MariBank");
    await user.selectOptions(screen.getByLabelText("From account"), "acc-wallet");
    await user.selectOptions(screen.getByLabelText("To account"), "acc-bank");
    await user.selectOptions(screen.getByLabelText("Savings or investment category"), "cat-mari");
    await user.click(screen.getByRole("button", { name: "Add transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toMatchObject({
      type: "transfer",
      amount: "500",
      account_id: "acc-wallet",
      to_account_id: "acc-bank",
      category_id: "cat-mari",
      adjustment_direction: null,
    });
  });

  it("edits a transaction with PUT, prefilled from the record", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.get("*/api/transactions/txn-1/attachments", () => ok([])),
      http.put("*/api/transactions/txn-1", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return ok(
          transaction({ amount: { amount: "300.00", currency: "PHP" } }),
          "Transaction updated."
        );
      })
    );
    const { user, onSaved } = open({ transaction: transaction() as never });
    await waitForPickers();

    expect(screen.getByLabelText("Amount")).toHaveValue("250.50");
    expect(screen.getByLabelText("Description")).toHaveValue("Groceries");

    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "300");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toMatchObject({
      type: "expense",
      amount: "300",
      account_id: "acc-wallet",
      category_id: "cat-food",
      transaction_date: "2026-10-20",
    });
  });
});
