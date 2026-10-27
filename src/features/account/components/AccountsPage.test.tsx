import { screen } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";

import { money, onboardedAuth } from "@/test/fixtures";
import { ok } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import AccountsPage from "./AccountsPage";

/** GET /accounts (AccountResource). */
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

describe("AccountsPage", () => {
  it("hides the balances behind asterisks, and shows them again", async () => {
    server.use(http.get("*/api/accounts", () => ok([wallet])));
    const { user } = renderWithProviders(<AccountsPage />, { auth: onboardedAuth() });

    expect(await screen.findByText("₱1,234.50")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide balances" }));
    expect(screen.queryByText("₱1,234.50")).not.toBeInTheDocument();
    expect(screen.getByText("*****")).toBeInTheDocument();
    expect(window.localStorage.getItem("poofsy:hide-accounts")).toBe("on");
    // Its own switch: the dashboard's total isn't affected.
    expect(window.localStorage.getItem("poofsy:hide-total")).toBeNull();

    const show = screen.getByRole("button", { name: "Show balances" });
    expect(show).toHaveAttribute("aria-pressed", "true");
    await user.click(show);
    expect(screen.getByText("₱1,234.50")).toBeInTheDocument();
    expect(window.localStorage.getItem("poofsy:hide-accounts")).toBeNull();
  });
});
