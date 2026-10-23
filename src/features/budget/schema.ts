import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

export const CATEGORY_KINDS = ["spending", "savings", "investment"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const BUDGET_STATUSES = ["draft", "active", "completed"] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

// Matches PayPeriodResource; `budget` is loaded by both pay-period endpoints.
export type PayPeriod = z.infer<typeof payPeriodSchema>;
export const payPeriodSchema = z.object({
  id: z.string(),
  label: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  pay_date: z.string(),
  sequence_in_month: z.number(),
  budget: z
    .object({ id: z.string(), status: z.enum(BUDGET_STATUSES) })
    .nullable()
    .optional(),
});

export const payPeriodResSchema = resSchema.extend({ data: payPeriodSchema });
export const payPeriodsResSchema = resSchema.extend({ data: z.array(payPeriodSchema) });

// The rule an allocation was resolved from (BudgetService::snapshot), or a manual edit.
export type RuleSnapshot = z.infer<typeof ruleSnapshotSchema>;
export const ruleSnapshotSchema = z
  .looseObject({
    rule_type: z.string().optional(),
    amount: z.string().nullable().optional(),
    percentage: z.string().nullable().optional(),
    cutoff_scope: z.string().optional(),
    rollover: z.boolean().optional(),
    manual: z.boolean().optional(),
  })
  .nullable();

export type Allocation = z.infer<typeof allocationSchema>;
export const allocationSchema = z.object({
  id: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
    kind: z.enum(CATEGORY_KINDS),
    is_essential: z.boolean(),
  }),
  amount: moneySchema,
  rollover_in: moneySchema,
  budgeted: moneySchema,
  actual: moneySchema,
  remaining: moneySchema,
  utilization: z.number().nullable(),
  status: z.enum(["ok", "approaching", "over"]),
  rule: ruleSnapshotSchema,
  destination_account: z.object({ id: z.string(), name: z.string() }).nullable(),
});

const overAllocatedSchema = z.object({
  type: z.enum(["over_allocated_expected", "over_allocated_actual"]),
  amount_over: moneySchema,
  categories: z.array(z.object({ category: z.string(), amount: moneySchema })),
});

export type BudgetWarning = z.infer<typeof warningSchema>;
export const warningSchema = z.discriminatedUnion("type", [
  overAllocatedSchema,
  z.object({
    type: z.literal("category_overspent"),
    category: z.string(),
    amount_over: moneySchema,
  }),
  z.object({ type: z.literal("approaching_limit"), category: z.string(), utilization: z.number() }),
  // PayLater due in this cutoff passes the share of income set on the PayLater page.
  z.object({
    type: z.literal("paylater_heavy"),
    amount: moneySchema,
    percent: z.number(),
    limit: moneySchema,
  }),
]);

// Matches BudgetService::summary(). Every figure is computed by the API.
export type BudgetSummary = z.infer<typeof budgetSummarySchema>;
export const budgetSummarySchema = z.object({
  id: z.string(),
  status: z.enum(BUDGET_STATUSES),
  notes: z.string().nullable(),
  completed_at: z.string().nullable(),
  reopened_at: z.string().nullable(),
  pay_period: z.object({
    id: z.string(),
    label: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    sequence_in_month: z.number(),
  }),
  template_id: z.string().nullable(),
  income: z.object({
    expected: moneySchema,
    actual: moneySchema,
    basis: z.enum(["actual", "expected"]),
  }),
  totals: z.object({
    allocated: moneySchema,
    remaining_unallocated: moneySchema,
    spending_actual: moneySchema,
    savings_actual: moneySchema,
    remaining_spendable: moneySchema,
    unbudgeted_spending: moneySchema,
  }),
  allocations: z.array(allocationSchema),
  unbudgeted: z.array(
    z.object({
      category: z
        .object({ id: z.string(), name: z.string(), color: z.string().nullable() })
        .nullable(),
      actual: moneySchema,
    })
  ),
  // PayLater still to pay in this cutoff: a planned obligation, not spending until it's paid.
  paylater: z.object({ scheduled: moneySchema, count: z.number() }),
  warnings: z.array(warningSchema),
});

export const budgetSummaryResSchema = resSchema.extend({ data: budgetSummarySchema });

// Pickers. Only the fields this feature needs (CategoryResource / AccountResource carry more).
export type CategoryOption = z.infer<typeof categoryOptionSchema>;
export const categoryOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(CATEGORY_KINDS),
  color: z.string().nullable(),
});
export const categoryOptionsResSchema = resSchema.extend({ data: z.array(categoryOptionSchema) });

export type AccountOption = z.infer<typeof accountOptionSchema>;
export const accountOptionSchema = z.object({ id: z.string(), name: z.string() });
export const accountOptionsResSchema = resSchema.extend({ data: z.array(accountOptionSchema) });

export type AllocationInput = {
  category_id?: string;
  amount?: string;
  rollover?: boolean;
};
