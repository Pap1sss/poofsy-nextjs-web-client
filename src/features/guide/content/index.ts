import type { GuideTopic } from "../types";
import { bills } from "./bills";
import { budgets } from "./budgets";
import { categories } from "./categories";
import { dashboard } from "./dashboard";
import { debts } from "./debts";
import { faq } from "./faq";
import { gettingStarted } from "./getting-started";
import { income } from "./income";
import { paylater } from "./paylater";
import { reports } from "./reports";
import { savings } from "./savings";
import { settings } from "./settings";
import { transactions } from "./transactions";
import { troubleshooting } from "./troubleshooting";
import { welcome } from "./welcome";

/**
 * The guide's chapters, in reading order. Each topic lives in its own file; write only what the
 * app really does, and update the topic when the feature it describes changes.
 */
export const GUIDE_TOPICS: GuideTopic[] = [
  welcome,
  gettingStarted,
  dashboard,
  income,
  transactions,
  categories,
  budgets,
  bills,
  savings,
  debts,
  paylater,
  reports,
  settings,
  faq,
  troubleshooting,
];

/** Offered when a search finds nothing; each must match something (search.test.ts checks). */
export const GUIDE_SEARCH_SUGGESTIONS = [
  "left to spend",
  "transfer",
  "rollover",
  "repayment",
  "installment",
  "archive",
];

/** Accordion value for an entry; ids are only unique within their topic. */
export function entryKey(topicId: string, entryId: string): string {
  return `${topicId}/${entryId}`;
}
