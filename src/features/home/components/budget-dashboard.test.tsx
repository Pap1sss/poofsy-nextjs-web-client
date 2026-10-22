import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { ChartCard } from "@/components/shared/chart-card";
import { money, onboardedAuth } from "@/test/fixtures";
import { ok, pickerHandlers } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { BudgetDashboard } from "./budget-dashboard";

const zero = money("0.00");

/** GET /dashboard for a user who just finished onboarding (DashboardService::for). */
const emptyDashboard = {
  range: {
    from: "2026-10-15",
    to: "2026-10-29",
    pay_period: { id: "pp-1", label: "Oct 15 – Oct 29, 2026" },
  },
  income: { actual: zero, expected: zero },
  spent: zero,
  saved: zero,
  left_to_spend: zero,
  net_worth: zero,
  accounts: [{ id: "acc-wallet", name: "Cash on hand", type: "cash", balance: zero }],
  budget: null,
  spending_by_category: [],
  upcoming_bills: [],
  goals: [],
  recent_transactions: [],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T02:00:00Z"));
  server.use(
    ...pickerHandlers,
    http.get("*/api/pay-periods/current", () =>
      ok({
        id: "pp-1",
        label: "Oct 15 – Oct 29, 2026",
        start_date: "2026-10-15",
        end_date: "2026-10-29",
        pay_date: "2026-10-15",
        sequence_in_month: 1,
        budget: null,
      })
    ),
    http.get("*/api/insights", () => ok([]))
  );
});

afterEach(() => vi.useRealTimers());

describe("Where the money went", () => {
  it("ranks categories with their share of the total, each opening its transactions", async () => {
    server.use(
      http.get("*/api/dashboard", () =>
        ok({
          ...emptyDashboard,
          spent: money("1000.00"),
          spending_by_category: [
            {
              category: { id: "cat-food", name: "Food", color: "#e34948" },
              amount: money("996.00"),
              share_percent: 99.6,
            },
            {
              category: { id: null, name: "Uncategorised", color: null },
              amount: money("4.00"),
              share_percent: 0.4,
            },
          ],
        })
      )
    );
    renderWithProviders(<BudgetDashboard greeting="Hi" />, { auth: onboardedAuth() });

    const section = within(await screen.findByRole("region", { name: "Where the money went" }));
    expect(section.getByText("₱1,000.00")).toBeInTheDocument();
    expect(section.getByText("Spent across 2 categories")).toBeInTheDocument();

    const food = section.getByRole("link", { name: /Food/ });
    expect(food).toHaveAttribute(
      "href",
      "/transactions?category_id=cat-food&from=2026-10-15&to=2026-10-29"
    );
    expect(food).toHaveTextContent("100%");
    // No id to filter by, so not a link; a tiny share still reads as something.
    expect(section.queryByRole("link", { name: /Uncategorised/ })).not.toBeInTheDocument();
    expect(section.getByText("<1%")).toBeInTheDocument();
  });
});

describe("BudgetDashboard for a brand-new user", () => {
  it("shows zeros, not errors, and three first steps", async () => {
    server.use(http.get("*/api/dashboard", () => ok(emptyDashboard)));
    renderWithProviders(<BudgetDashboard greeting="Good morning, Maria" />, {
      auth: onboardedAuth(),
    });

    // The headline is total money across accounts, with each account listed.
    const hero = await screen.findByRole("region", { name: "Total money" });
    expect(hero).toHaveTextContent("₱0.00");
    expect(within(hero).getByText("Cash on hand")).toBeInTheDocument();
    expect(
      within(hero).getByText("Across 1 account. Savings goals are part of these balances.")
    ).toBeInTheDocument();

    // The range's flow sits below: earned, spent, saved and what's left.
    const flow = within(screen.getByRole("region", { name: /Money in and out/ }));
    for (const label of ["Earned", "Spent", "Saved", "Left to spend"]) {
      expect(flow.getByText(label)).toBeInTheDocument();
    }

    const start = within(screen.getByRole("region", { name: "Start here" }));
    expect(start.getByRole("link", { name: /Record your income/ })).toHaveAttribute(
      "href",
      "/income"
    );
    expect(start.getByRole("link", { name: /Plan this payday/ })).toHaveAttribute(
      "href",
      "/budgets"
    );
    expect(start.getByRole("link", { name: /Add a bill/ })).toHaveAttribute("href", "/bills");

    expect(screen.getByText("Showing Oct 15 – Oct 29, 2026")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hides every amount behind asterisks, and shows them again", async () => {
    server.use(http.get("*/api/dashboard", () => ok(emptyDashboard)));
    const { user } = renderWithProviders(<BudgetDashboard greeting="Hi" />, {
      auth: onboardedAuth(),
    });
    const hero = await screen.findByRole("region", { name: "Total money" });

    await user.click(screen.getByRole("button", { name: "Hide amounts" }));
    expect(screen.queryByText(/₱/)).not.toBeInTheDocument();
    expect(hero).toHaveTextContent("*****");
    expect(window.localStorage.getItem("poofsy:hide-amounts")).toBe("on");

    const show = screen.getByRole("button", { name: "Show amounts" });
    expect(show).toHaveAttribute("aria-pressed", "true");
    await user.click(show);
    expect(hero).toHaveTextContent("₱0.00");
    expect(window.localStorage.getItem("poofsy:hide-amounts")).toBeNull();
  });

  it("asks the API for the current cutoff without sending a range", async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get("*/api/dashboard", ({ request }) => {
        params = new URL(request.url).searchParams;
        return ok(emptyDashboard);
      })
    );
    renderWithProviders(<BudgetDashboard greeting="Hi" />, { auth: onboardedAuth() });

    await screen.findByRole("region", { name: "Total money" });
    expect(params?.toString()).toBe("");
  });

  it("explains a failure to load", async () => {
    server.use(
      http.get("*/api/dashboard", () =>
        HttpResponse.json(
          { success: false, message: "Finish setting up your budget before using this." },
          { status: 409 }
        )
      )
    );
    renderWithProviders(<BudgetDashboard greeting="Hi" />, { auth: onboardedAuth() });

    expect(
      await screen.findByText(/Finish setting up your budget before using this\./)
    ).toBeInTheDocument();
  });
});

describe("ChartCard states", () => {
  const chart = (props: Partial<Parameters<typeof ChartCard>[0]>) =>
    renderWithProviders(
      <ChartCard title="Spending by category" {...props}>
        <p>the chart</p>
      </ChartCard>
    );

  it("shows a skeleton while loading", () => {
    const { container } = chart({ isLoading: true });

    expect(screen.queryByText("the chart")).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });

  it("explains an error", () => {
    chart({ error: new Error("Network down") });

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load this chart: Network down");
  });

  it("says what to do when there's nothing to show", () => {
    chart({ isEmpty: true, emptyMessage: "Record expenses to see where your money goes." });

    expect(screen.getByText("Record expenses to see where your money goes.")).toBeInTheDocument();
    expect(screen.queryByText("the chart")).not.toBeInTheDocument();
  });

  it("renders the chart once data is in", () => {
    chart({});

    expect(screen.getByRole("heading", { name: "Spending by category" })).toBeInTheDocument();
    expect(screen.getByText("the chart")).toBeInTheDocument();
  });
});
