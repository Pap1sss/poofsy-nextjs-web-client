import type { SpriteName } from "@/components/pixel/sprites";

export const groupQueryKey = "groups";
// Picker lists (accounts, categories, people), kept under this feature's own key.
export const groupLookupsQueryKey = "group-lookups";

export const SPLIT_METHODS = ["equal", "amount", "shares", "percent", "quantity", "items"] as const;
export const CHARGE_KINDS = [
  "delivery",
  "service",
  "platform",
  "tax",
  "other",
  "discount",
  "voucher",
] as const;
export const CHARGE_ALLOCATIONS = [
  "equal",
  "proportional",
  "amount",
  "shares",
  "assigned",
] as const;
export const GROUP_STATUSES = ["active", "completed"] as const;

export const SPLIT_LABELS = {
  equal: "Equally",
  amount: "By amount",
  shares: "By shares",
  percent: "By percent",
  quantity: "By quantity",
  items: "By items",
} as const;

/** One line under the method picker, so people know what to type. */
export const SPLIT_HINTS = {
  equal: "Everyone ticked pays the same. Untick anyone who isn't part of this.",
  amount: "Type what each person owes. The amounts must add up to the subtotal.",
  shares:
    "Give each person a number of shares, like 2 for someone who had double. Decimals work (1.5).",
  percent: "Give each person a percentage. They must add up to 100%.",
  quantity: "Type how much each person used or had, like 3 bottles or 2 kilos.",
  items: "List what was ordered and tick who had each item. Shared items are split equally.",
} as const;

export const CHARGE_LABELS = {
  delivery: "Delivery / shipping",
  service: "Service charge",
  platform: "Platform fee",
  tax: "Tax",
  other: "Other charge",
  discount: "Discount",
  voucher: "Voucher",
} as const;

export const ALLOCATION_LABELS = {
  equal: "Split equally",
  proportional: "By each person's subtotal",
  amount: "By amount",
  shares: "By shares",
  assigned: "Only certain people",
} as const;

export const isDiscount = (kind: (typeof CHARGE_KINDS)[number]) =>
  kind === "discount" || kind === "voucher";

/** Group colours: the same muted pixel palette as categories, stored as hex. */
export const GROUP_COLORS = [
  "#7a9cc6",
  "#3fae4f",
  "#f2c230",
  "#d6402f",
  "#f29bb0",
  "#a8713f",
  "#8e6fc1",
  "#2f9e9e",
] as const;

export const GROUP_ICONS = [
  "bag",
  "coin",
  "house",
  "star",
  "flag",
  "receipt",
  "wallet",
  "calendar",
] as const satisfies readonly SpriteName[];
