export const paylaterQueryKey = "paylater";
// Picker lists, kept under this feature's own key so they never collide with other features' caches.
export const paylaterLookupsQueryKey = "paylater-lookups";

/** Common providers offered as one-tap starting points; any other name can be typed. */
export const PROVIDER_PRESETS = [
  "Shopee SPayLater",
  "TikTok PayLater",
  "LazPayLater",
  "Other PayLater",
] as const;

export const INSTALLMENT_STATUSES = [
  "upcoming",
  "due_soon",
  "due",
  "partially_paid",
  "overdue",
  "paid",
  "cancelled",
] as const;

export const PURCHASE_STATUSES = ["active", "overdue", "paid_off", "cancelled"] as const;

export const RECORD_AS = ["expense", "link", "none"] as const;

export const PURCHASE_SORTS = [
  "-purchase_date",
  "purchase_date",
  "next_due",
  "-remaining",
  "remaining",
] as const;

export const INSTALLMENT_STATUS_LABELS = {
  upcoming: "Upcoming",
  due_soon: "Due soon",
  due: "Due today",
  partially_paid: "Partially paid",
  overdue: "Overdue",
  paid: "Paid",
  cancelled: "Cancelled",
} as const;

export const PURCHASE_STATUS_LABELS = {
  active: "Active",
  overdue: "Overdue",
  paid_off: "Paid off",
  cancelled: "Cancelled",
} as const;

export const SORT_LABELS = {
  "-purchase_date": "Newest first",
  purchase_date: "Oldest first",
  next_due: "Next due soonest",
  "-remaining": "Largest balance",
  remaining: "Smallest balance",
} as const;

/** Common plan lengths offered first; any whole number of months works. */
export const DURATION_PRESETS = [1, 3, 6, 9, 12] as const;
