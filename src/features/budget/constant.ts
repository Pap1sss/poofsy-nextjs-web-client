export const queryKey = "budgets";

export const budgetKeys = {
  all: [queryKey] as const,
  currentPeriod: [queryKey, "current-period"] as const,
  periods: (from: string, to: string) => [queryKey, "periods", from, to] as const,
  detail: (id: string) => [queryKey, "detail", id] as const,
  categories: [queryKey, "category-options"] as const,
  accounts: [queryKey, "account-options"] as const,
};

export const STATUS_LABEL = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
} as const;

export const KIND_LABEL = {
  spending: "Spending",
  savings: "Savings",
  investment: "Investments",
} as const;
