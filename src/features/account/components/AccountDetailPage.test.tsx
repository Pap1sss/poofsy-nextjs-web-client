import { screen, waitFor, within } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { money, onboardedAuth, paginated, transaction } from "@/test/fixtures";
import { ok, pickerHandlers } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { AccountDetailPage } from "./AccountDetailPage";

/** GET /accounts/{id} (AccountResource). */
const wallet = {
  id: "acc-wallet",
  name: "Cash on hand",
  type: "cash",
  currency: "PHP",
  starting_balance: money("500.00"),
  current_balance: money("1234.50"),
  notes: null,
  sort_order: 0,
  archived_at: null,
  created_at: "2026-10-21T00:00:00Z",
};

/** Every GET /transactions query string the page sends. */
let requests: URLSearchParams[];

beforeEach(() => {
  requests = [];
  server.use(
    ...pickerHandlers,
    http.get("*/api/accounts/acc-wallet", () => ok(wallet)),
    http.get("*/api/accounts/acc-wallet/balance-history", () =>
      ok([{ date: "2026-08-02", balance: money("500.00") }])
    ),
    http.get("*/api/transactions", ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return ok(
        paginated([
          transaction({
            type: "transfer",
            description: "Top up from bank",
            category: null,
            to_account: { id: "acc-wallet", name: "Cash on hand" },
            account: { id: "acc-bank", name: "BPI" },
            amount: money("800.00"),
            account_change: money("800.00"),
            balance_after: money("1234.50"),
          }),
        ])
      );
    })
  );
});

const renderPage = () =>
  renderWithProviders(<AccountDetailPage accountId="acc-wallet" />, { auth: onboardedAuth() });

describe("AccountDetailPage", () => {
  it("lists only this account's transactions, with each change and the running balance", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Cash on hand" })).toBeInTheDocument();
    await waitFor(() => expect(requests.at(-1)?.get("account_id")).toBe("acc-wallet"));

    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Balance" })).toBeInTheDocument();
    // A transfer in shows as money in, and the balance after it comes from the API.
    expect(within(table).getByText("+₱800.00")).toBeInTheDocument();
    expect(within(table).getByText("₱1,234.50")).toBeInTheDocument();
    // The account is fixed here, so the filters have no account picker.
    expect(screen.queryByRole("combobox", { name: "Account" })).not.toBeInTheDocument();
  });

  it("masks the balances with the Accounts privacy switch", async () => {
    const { user } = renderPage();

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Hide balances" }));

    expect(screen.queryByText("₱1,234.50")).not.toBeInTheDocument();
    expect(screen.getByText(/Balances are hidden/)).toBeInTheDocument();
    // The change itself is a transaction amount, not a balance, so it stays visible.
    expect(within(screen.getByRole("table")).getByText("+₱800.00")).toBeInTheDocument();
  });
});
