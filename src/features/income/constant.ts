import { routes } from "@/config/routes";
import { TabLinkSchema } from "@/lib/schemas";

export const incomeQueryKey = "incomes";
export const incomeSourcesQueryKey = "income-sources";
export const incomeLookupsQueryKey = "income-lookups";

/** Query keys of other modules whose figures change when income is recorded. */
export const AFFECTED_BY_INCOME = ["transactions", "accounts", "budgets"] as const;

export const incomeTabLinks: TabLinkSchema[] = [
  { title: "Payslips", url: routes.income.home },
  { title: "Income sources", url: routes.income.sources },
];

export const SOURCE_TYPES = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "business", label: "Business" },
  { value: "allowance", label: "Allowance" },
  { value: "other", label: "Other" },
] as const;

export const FREQUENCIES = [
  { value: "per_pay_period", label: "Every payday" },
  { value: "monthly", label: "Monthly" },
  { value: "irregular", label: "Irregular" },
] as const;

export const frequencyLabel = (value: string) =>
  FREQUENCIES.find((f) => f.value === value)?.label ?? value;

export const sourceTypeLabel = (value: string) =>
  SOURCE_TYPES.find((t) => t.value === value)?.label ?? value;
