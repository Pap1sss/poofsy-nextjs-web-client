import { formatMoney } from "@/lib/money";

import type { RuleSnapshot } from "./schema";

const SCOPE: Record<string, string> = {
  every: "every cutoff",
  first: "on the 1st cutoff",
  second: "on the 2nd cutoff",
};

/** Describes where an allocation's amount came from, in words: "₱4,000 on the 1st cutoff". */
export function describeRule(rule: RuleSnapshot, currency: string, locale: string): string {
  if (!rule) return "";
  if (rule.manual) return "Edited";

  const money = (amount: string | null | undefined) =>
    formatMoney({ amount: amount ?? "0", currency }, locale);

  switch (rule.rule_type) {
    case "fixed":
      return `${money(rule.amount)} ${SCOPE[rule.cutoff_scope ?? "every"] ?? ""}`.trim();
    case "monthly_split":
      return `${money(rule.amount)} a month, split across cutoffs`;
    case "percentage":
      return `${Number(rule.percentage ?? 0).toString()}% of income`;
    case "custom":
      return "Entered each cutoff";
    default:
      return "";
  }
}
