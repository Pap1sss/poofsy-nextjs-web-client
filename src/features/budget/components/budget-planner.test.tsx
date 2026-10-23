import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import "@/config/routes"; // see src/test/navigation.test.tsx: settles an import cycle
import { money, onboardedAuth } from "@/test/fixtures";
import { ok, pickerHandlers } from "@/test/handlers";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { BudgetPlanner } from "./budget-planner";

const allocation = (overrides: Record<string, unknown>) => ({
  id: "alloc",
  category: {
    id: "cat",
    name: "Category",
    color: "#22c55e",
    kind: "spending",
    is_essential: false,
  },
  amount: money("1000.00"),
  rollover_in: money("0.00"),
  budgeted: money("1000.00"),
  actual: money("0.00"),
  remaining: money("1000.00"),
  utilization: 0,
  status: "ok",
  rule: { rule_type: "fixed", amount: "1000.0000", cutoff_scope: "every", rollover: false },
  destination_account: null,
  ...overrides,
});

/**
 * GET /budgets/{id} (BudgetService::summary). The totals deliberately don't equal what the rows
 * would add up to: the page must show the API's figures, never its own sums.
 */
const summary = {
  id: "budget-1",
  status: "active",
  notes: null,
  completed_at: null,
  reopened_at: null,
  pay_period: {
    id: "pp-1",
    label: "Oct 15 – Oct 29, 2026",
    start_date: "2026-10-15",
    end_date: "2026-10-29",
    sequence_in_month: 1,
  },
  template_id: "tpl-1",
  income: { expected: money("12106.59"), actual: money("12106.59"), basis: "actual" },
  totals: {
    allocated: money("9999.99"),
    remaining_unallocated: money("2106.60"),
    spending_actual: money("1550.50"),
    savings_actual: money("500.00"),
    remaining_spendable: money("-123.45"),
    unbudgeted_spending: money("300.00"),
  },
  allocations: [
    allocation({
      id: "a-motor",
      category: {
        id: "c-motor",
        name: "Motor",
        color: "#0ea5e9",
        kind: "spending",
        is_essential: true,
      },
      actual: money("1200.50"),
      remaining: money("-200.50"),
      utilization: 120.1,
      status: "over",
    }),
    allocation({
      id: "a-leisure",
      category: {
        id: "c-leisure",
        name: "Leisure",
        color: "#a855f7",
        kind: "spending",
        is_essential: false,
      },
      amount: money("0.00"),
      budgeted: money("0.00"),
      actual: money("300.00"),
      remaining: money("-300.00"),
      utilization: null,
      status: "over",
    }),
    allocation({
      id: "a-shopping",
      category: {
        id: "c-shopping",
        name: "Shopping",
        color: "#eab308",
        kind: "spending",
        is_essential: false,
      },
      amount: money("0.00"),
      budgeted: money("0.00"),
      remaining: money("0.00"),
      utilization: null,
    }),
    allocation({
      id: "a-mari",
      category: {
        id: "c-mari",
        name: "MariBank",
        color: "#f43f5e",
        kind: "savings",
        is_essential: false,
      },
      amount: money("500.00"),
      budgeted: money("800.00"),
      rollover_in: money("300.00"),
      actual: money("500.00"),
      remaining: money("300.00"),
      utilization: 62.5,
      rule: { rule_type: "fixed", amount: "500.0000", cutoff_scope: "every", rollover: true },
    }),
  ],
  unbudgeted: [
    { category: { id: "c-gifts", name: "Gifts", color: null }, actual: money("300.00") },
  ],
  paylater: { scheduled: money("0.00"), count: 0 },
  warnings: [
    {
      type: "over_allocated_actual",
      amount_over: money("1814.73"),
      categories: [{ category: "Motor", amount: money("1000.00") }],
    },
    { type: "category_overspent", category: "Motor", amount_over: money("200.50") },
    { type: "approaching_limit", category: "Food", utilization: 83.4 },
  ],
};

beforeEach(() => {
  server.use(
    ...pickerHandlers,
    http.get("*/api/budgets/budget-1", () => ok(summary)),
    http.get("*/api/pay-periods", () => ok([]))
  );
});

/** The StatCard around a label: label span -> header row -> card. */
const card = (label: string) => screen.getByText(label).parentElement!.parentElement!;

const renderPlanner = () =>
  renderWithProviders(<BudgetPlanner budgetId="budget-1" />, { auth: onboardedAuth() });

describe("BudgetPlanner shows the API's figures", () => {
  it("shows income, planned and left-over amounts exactly as the API sent them", async () => {
    renderPlanner();

    expect(
      await screen.findByRole("heading", { name: "Oct 15 – Oct 29, 2026" })
    ).toBeInTheDocument();
    expect(card("Income received")).toHaveTextContent("₱12,106.59");
    // 9,999.99 is the API's total, not a sum of the rows above.
    expect(card("Planned")).toHaveTextContent("₱9,999.99");
    expect(card("Left to plan")).toHaveTextContent("₱2,106.60");
  });

  it("keeps a negative 'left to spend' negative and styled as an expense", async () => {
    renderPlanner();

    await screen.findByText("Left to spend");
    const value = within(card("Left to spend")).getByText("-₱123.45");
    expect(value).toHaveClass("text-expense");
  });

  it("labels zero allocations instead of dividing by zero", async () => {
    renderPlanner();

    expect(
      await screen.findByText("Unbudgeted spending", { selector: "span" })
    ).toBeInTheDocument();
    expect(screen.getByText("No allocation", { selector: "span" })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("progressbar")
        .some((bar) => bar.getAttribute("aria-valuetext") === "No allocation")
    ).toBe(true);
  });

  it("shows how far over a category is, from the API's remaining", async () => {
    renderPlanner();

    const overBar = (await screen.findAllByRole("progressbar")).find(
      (bar) => bar.getAttribute("aria-valuetext") === "120% used"
    );
    expect(overBar).toBeDefined();
    expect(screen.getAllByText(/₱200\.50/).length).toBeGreaterThan(0);
  });

  it("words the warnings plainly", async () => {
    renderPlanner();

    const warnings = within(await screen.findByRole("region", { name: "Needs your attention" }));
    expect(warnings.getByText(/You've planned/)).toHaveTextContent(
      "You've planned ₱1,814.73 more than you actually received."
    );
    expect(
      warnings.getByText(
        (_, el) => el?.tagName === "P" && el.textContent === "Motor is ₱200.50 over budget."
      )
    ).toBeInTheDocument();
    expect(warnings.getByText("Food has used 83% of its budget.")).toBeInTheDocument();
  });

  it("groups allocations by kind and lists unbudgeted spending", async () => {
    renderPlanner();

    expect(await screen.findByRole("heading", { name: "Savings" })).toBeInTheDocument();
    const unbudgeted = within(screen.getByRole("region", { name: "Unbudgeted spending" }));
    expect(unbudgeted.getByText("Gifts")).toBeInTheDocument();
    expect(unbudgeted.getByText("₱300.00")).toBeInTheDocument();
  });
});
