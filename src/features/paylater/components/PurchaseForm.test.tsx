import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { onboardedAuth } from "@/test/fixtures";
import { ok } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { nextDueDate, PurchaseForm } from "./PurchaseForm";

const money = (amount: string) => ({ amount, currency: "PHP" });

/** The body of every POST the form sends, by path. */
let posted: Record<string, Record<string, unknown>[]>;

const account = {
  id: "pl-spay",
  provider_name: "Shopee SPayLater",
  nickname: null,
  credit_limit: null,
  available_credit: null,
  available_is_estimate: false,
  due_day: null,
  outstanding: money("0.00"),
  overdue: money("0.00"),
  due_this_month: money("0.00"),
  purchases_count: 0,
  open_purchases_count: 0,
  notes: null,
  archived_at: null,
};

beforeEach(() => {
  posted = { preview: [], purchase: [] };
  server.use(
    http.get("*/api/paylater-accounts", () => ok([account])),
    http.get("*/api/categories", () => ok([])),
    http.get("*/api/accounts", () => ok([])),
    http.post("*/api/paylater/preview-schedule", async ({ request }) => {
      posted.preview.push((await request.json()) as Record<string, unknown>);
      return ok({
        suggested_total: money("3150.00"),
        total_repayment: money("3150.00"),
        installments: [
          { number: 1, due_date: "2026-11-05", amount: money("1050.00") },
          { number: 2, due_date: "2026-12-05", amount: money("1050.00") },
          { number: 3, due_date: "2027-01-05", amount: money("1050.00") },
        ],
      });
    }),
    http.post("*/api/paylater-purchases", async ({ request }) => {
      posted.purchase.push((await request.json()) as Record<string, unknown>);
      // The form navigates away on success; a validation error keeps the test simple.
      return HttpResponse.json({ success: false, message: "stop", errors: {} }, { status: 422 });
    })
  );
});

describe("PurchaseForm", () => {
  it("fills the schedule from the API's preview and sends it as edited", async () => {
    const { user } = renderWithProviders(
      <PurchaseForm open onOpenChange={() => {}} accountId="pl-spay" />,
      { auth: onboardedAuth() }
    );

    await user.type(await screen.findByLabelText("What did you buy?"), "Rice cooker");
    await user.type(screen.getByLabelText("Purchase amount"), "3000");
    await user.type(screen.getByLabelText("Fees"), "150");
    await user.type(screen.getByLabelText("First due date"), "2026-11-05");
    await user.click(screen.getByRole("button", { name: "Fill the schedule" }));

    // The split comes from the API; the form never works it out itself (D5).
    const third = await screen.findByLabelText("Installment 3 amount");
    expect(posted.preview[0]).toMatchObject({
      original_amount: "3000",
      fees: "150",
      installment_count: 3,
      first_due_date: "2026-11-05",
    });
    expect(screen.getByLabelText("Total to repay")).toHaveValue("3150.00");

    // Match a statement that bills the last installment differently.
    await user.clear(third);
    await user.type(third, "1000");
    await user.clear(screen.getByLabelText("Total to repay"));
    await user.type(screen.getByLabelText("Total to repay"), "3100");
    await user.click(screen.getByRole("button", { name: "Save purchase" }));

    await waitFor(() => expect(posted.purchase).toHaveLength(1));
    expect(posted.purchase[0]).toMatchObject({
      paylater_account_id: "pl-spay",
      description: "Rice cooker",
      total_repayment: "3100",
      installments: [
        { due_date: "2026-11-05", amount: "1050.00" },
        { due_date: "2026-12-05", amount: "1050.00" },
        { due_date: "2027-01-05", amount: "1000" },
      ],
    });
  });
});

describe("nextDueDate", () => {
  it("takes the account's pay date after the purchase, clamped to short months", () => {
    expect(nextDueDate("2026-10-05", 15)).toBe("2026-10-15");
    expect(nextDueDate("2026-10-15", 15)).toBe("2026-11-15");
    expect(nextDueDate("2026-12-20", 5)).toBe("2027-01-05");
    expect(nextDueDate("2027-01-31", 30)).toBe("2027-02-28");
  });
});
