import type { AuthResponse } from "@/features/auth/schema/auth";

/** Shapes copied from the Laravel resources, so tests exercise the same parsing the app does. */

export const money = (amount: string, currency = "PHP") => ({ amount, currency });

/** GET auth/spa/authenticate for an onboarded PH user (UserSettingResource inside). */
export const onboardedAuth = (
  overrides: Partial<NonNullable<AuthResponse["data"]>> = {}
): AuthResponse => ({
  success: true,
  message: "Authenticated successfully.",
  data: {
    id: "user-1",
    email: "maria@example.com",
    username: "maria",
    name: "Maria Clara",
    permissions: [],
    roles: ["user"],
    onboarded: true,
    settings: {
      preset: "ph",
      currency: "PHP",
      currency_minor_units: 2,
      locale: "en-PH",
      timezone: "Asia/Manila",
      date_format: "MMM d, yyyy",
      theme: "system",
      rollover_default: true,
      rollover_overspending: false,
      approaching_limit_percent: 80,
      dashboard_prefs: null,
      onboarded_at: "2026-10-21T08:00:00+00:00",
    },
    ...overrides,
  },
});

export const accounts = [
  { id: "acc-wallet", name: "Cash on hand", archived_at: null },
  { id: "acc-bank", name: "BPI Savings", archived_at: null },
  { id: "acc-old", name: "Old wallet", archived_at: "2026-01-01T00:00:00+00:00" },
];

export const categories = [
  { id: "cat-food", name: "Food Allowance", kind: "spending", color: "#22c55e", archived_at: null },
  {
    id: "cat-motor",
    name: "Motor / Transportation",
    kind: "spending",
    color: "#0ea5e9",
    archived_at: null,
  },
  { id: "cat-mari", name: "MariBank", kind: "savings", color: "#f43f5e", archived_at: null },
];

export const paymentMethods = [
  { id: "pm-cash", name: "Cash", archived_at: null },
  { id: "pm-gcash", name: "GCash", archived_at: null },
];

/** One TransactionResource row. */
export const transaction = (overrides: Record<string, unknown> = {}) => ({
  id: "txn-1",
  type: "expense",
  amount: money("250.50"),
  adjustment_direction: null,
  transaction_date: "2026-10-20",
  description: "Groceries",
  notes: null,
  account: { id: "acc-wallet", name: "Cash on hand" },
  to_account: null,
  category: { id: "cat-food", name: "Food Allowance", color: "#22c55e", kind: "spending" },
  payment_method: { id: "pm-cash", name: "Cash" },
  pay_period_id: "pp-1",
  bill_occurrence_id: null,
  from_income_record: false,
  attachments_count: 0,
  created_at: "2026-10-20T10:00:00+00:00",
  ...overrides,
});

/** A Laravel paginator wrapped by TransactionService::index(). */
export const paginated = <T>(rows: T[], page = 1, perPage = 25, total = rows.length) => ({
  data: rows,
  links: {
    first: "/?page=1",
    last: `/?page=${Math.max(1, Math.ceil(total / perPage))}`,
    prev: null,
    next: null,
  },
  meta: {
    current_page: page,
    from: rows.length ? (page - 1) * perPage + 1 : null,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    links: [],
    path: "http://localhost:8000/api/v1/transactions",
    per_page: perPage,
    to: rows.length ? (page - 1) * perPage + rows.length : null,
    total,
  },
});
