import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";
import { allocationSchema, BUDGET_STATUSES, warningSchema } from "@/features/budget/schema";
import { transactionSchema } from "@/features/transaction/schema";

const ref = z.object({ id: z.string(), name: z.string() });
const colorRef = z.object({ id: z.string(), name: z.string(), color: z.string().nullable() });

// Matches App\Http\Resources\BillOccurrenceResource.
export type DashboardBill = z.infer<typeof billOccurrenceSchema>;
export const billOccurrenceSchema = z.object({
  id: z.string(),
  due_date: z.string(),
  amount: moneySchema,
  status: z.enum(["upcoming", "overdue", "paid", "skipped"]),
  paid_at: z.string().nullable(),
  transaction_id: z.string().nullable(),
  bill: z
    .object({
      id: z.string(),
      name: z.string(),
      category: colorRef.nullable(),
      account: ref.nullable(),
    })
    .optional(),
});

// Matches SavingsGoalService::present() without contributions.
export type DashboardGoal = z.infer<typeof goalSchema>;
export const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  account: ref.nullable(),
  is_emergency_fund: z.boolean(),
  emergency_months: z.number().nullable(),
  essential_monthly: moneySchema.nullable(),
  target_amount: moneySchema,
  target_is_computed: z.boolean(),
  saved: moneySchema,
  remaining: moneySchema,
  progress_percent: z.number().nullable(),
  target_date: z.string().nullable(),
  monthly_needed: moneySchema.nullable(),
  archived_at: z.string().nullable(),
});

// Matches DashboardService::for().
export type Dashboard = z.infer<typeof dashboardSchema>;
export const dashboardSchema = z.object({
  range: z.object({
    from: z.string(),
    to: z.string(),
    pay_period: z.object({ id: z.string(), label: z.string() }).nullable(),
  }),
  income: z.object({ actual: moneySchema, expected: moneySchema.nullable() }),
  spent: moneySchema,
  saved: moneySchema,
  left_to_spend: moneySchema,
  net_worth: moneySchema,
  accounts: z.array(
    z.object({ id: z.string(), name: z.string(), type: z.string(), balance: moneySchema })
  ),
  budget: z
    .object({
      id: z.string(),
      status: z.enum(BUDGET_STATUSES),
      allocated: moneySchema,
      remaining_unallocated: moneySchema,
      income_basis: z.enum(["actual", "expected"]),
      allocations: z.array(allocationSchema),
      warnings: z.array(warningSchema),
    })
    .nullable(),
  spending_by_category: z.array(
    z.object({
      category: z.object({
        id: z.string().nullable(),
        name: z.string(),
        color: z.string().nullable(),
      }),
      amount: moneySchema,
      share_percent: z.number().nullable(),
    })
  ),
  upcoming_bills: z.array(billOccurrenceSchema),
  goals: z.array(goalSchema),
  recent_transactions: z.array(transactionSchema),
});

export const dashboardResSchema = resSchema.extend({ data: dashboardSchema });

// Matches InsightService::for(): a type plus numbers; the UI words them.
export type Insight = z.infer<typeof insightSchema>;
const tone = z.enum(["positive", "warning", "info"]);
export const insightSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("category_spike"),
    tone,
    data: z.object({
      category: colorRef.nullable(),
      change_percent: z.number(),
      this_cutoff: moneySchema,
      last_cutoff: moneySchema,
    }),
  }),
  z.object({
    type: z.literal("savings_rate"),
    tone,
    data: z.object({
      this_month_percent: z.number(),
      last_month_percent: z.number().nullable(),
    }),
  }),
  z.object({
    type: z.literal("unbudgeted_spending"),
    tone,
    data: z.object({ amount: moneySchema, budget_id: z.string() }),
  }),
  z.object({
    type: z.literal("bills_due_soon"),
    tone,
    data: z.object({ count: z.number(), total: moneySchema }),
  }),
  z.object({
    type: z.literal("emergency_fund_coverage"),
    tone,
    data: z.object({
      months_covered: z.number(),
      goal_months: z.number().nullable(),
      goal_id: z.string(),
    }),
  }),
]);

export const insightsResSchema = resSchema.extend({ data: z.array(insightSchema) });

export const currentPeriodResSchema = resSchema.extend({
  data: z.object({
    id: z.string(),
    label: z.string(),
    start_date: z.string(),
    end_date: z.string(),
  }),
});
