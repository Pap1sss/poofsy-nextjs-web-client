export const reportQueryKey = "reports";

/** URL segment of each report under /reports/{name}, as App\Http\Controllers\InsightsController::REPORTS. */
export const REPORTS = [
  "cash-flow",
  "category-spending",
  "budget-performance",
  "income",
  "expenses",
  "savings-rate",
  "cutoff-comparison",
  "account-balances",
] as const;

export type ReportName = (typeof REPORTS)[number];
