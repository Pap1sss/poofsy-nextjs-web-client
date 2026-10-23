export const debtQueryKey = "debts";
export const peopleQueryKey = "debt-people";
// Picker lists, kept under this feature's own key so they never collide with other features' caches.
export const debtLookupsQueryKey = "debt-lookups";

export const DEBT_DIRECTIONS = ["receivable", "payable"] as const;
export const DEBT_STATUSES = [
  "active",
  "partially_paid",
  "overdue",
  "settled",
  "cancelled",
] as const;
export const RECORD_AS = ["balance", "cash_flow", "none"] as const;
export const DEBT_SORTS = [
  "due_date",
  "-due_date",
  "-remaining",
  "remaining",
  "-debt_date",
  "debt_date",
] as const;
export const DUE_FILTERS = ["overdue", "next_7", "next_30", "none"] as const;

export const DIRECTION_LABELS = {
  receivable: "Owed to me",
  payable: "I owe",
} as const;

export const STATUS_LABELS = {
  active: "Active",
  partially_paid: "Partially paid",
  overdue: "Overdue",
  settled: "Fully settled",
  cancelled: "Cancelled",
} as const;

export const SORT_LABELS = {
  due_date: "Due soonest",
  "-due_date": "Due latest",
  "-remaining": "Largest balance",
  remaining: "Smallest balance",
  "-debt_date": "Newest first",
  debt_date: "Oldest first",
} as const;

export const DUE_LABELS = {
  overdue: "Overdue",
  next_7: "Due in 7 days",
  next_30: "Due in 30 days",
  none: "No due date",
} as const;
