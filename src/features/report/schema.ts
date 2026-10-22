import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

// Shapes match App\Services\ReportService exactly; the response wraps them as { success, message, data, meta }.

const categoryRef = z.object({
  id: z.string().nullable(),
  name: z.string(),
  color: z.string().nullable(),
});

export const cashFlowSchema = z.array(
  z.object({
    month: z.string(),
    income: moneySchema,
    expenses: moneySchema,
    saved: moneySchema,
    net: moneySchema,
  })
);

const categoryShare = z.object({
  category: categoryRef,
  amount: moneySchema,
  share_percent: z.number().nullable(),
});

// ReportService::categorySpending(): every category for the table, the top ones for the chart, and the
// rest folded into "Other" by the API (the browser never adds money up).
export const categorySpendingSchema = z.object({
  total: moneySchema,
  categories: z.array(categoryShare),
  top: z.array(categoryShare),
  other: z
    .object({ count: z.number(), amount: moneySchema, share_percent: z.number().nullable() })
    .nullable(),
});

export const budgetPerformanceSchema = z.array(
  z.object({
    budget_id: z.string(),
    label: z.string(),
    start_date: z.string(),
    status: z.enum(["draft", "active", "completed"]),
    planned: moneySchema,
    spent: moneySchema,
    saved: moneySchema,
    /** Spent plus saved, computed by the API. */
    actual: moneySchema,
    income: moneySchema,
    overspent_categories: z.number(),
  })
);

export const incomeReportSchema = z.array(
  z.object({
    month: z.string(),
    total: moneySchema,
    sources: z.array(z.object({ name: z.string(), amount: moneySchema })),
  })
);

export const expensesReportSchema = z.object({
  months: z.array(z.object({ month: z.string(), total: moneySchema })),
  largest: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      description: z.string(),
      category: categoryRef.nullable(),
      amount: moneySchema,
    })
  ),
});

export const savingsRateSchema = z.array(
  z.object({
    month: z.string(),
    income: moneySchema,
    saved: moneySchema,
    rate_percent: z.number().nullable(),
  })
);

export const cutoffComparisonSchema = z.array(
  z.object({
    sequence: z.number(),
    cutoffs: z.number(),
    total_spending: moneySchema,
    average_spending: moneySchema,
  })
);

export const accountBalancesSchema = z.array(
  z.object({
    account: z.object({ id: z.string(), name: z.string(), type: z.string() }),
    points: z.array(z.object({ month: z.string(), balance: moneySchema })),
  })
);

export const reportSchemas = {
  "cash-flow": cashFlowSchema,
  "category-spending": categorySpendingSchema,
  "budget-performance": budgetPerformanceSchema,
  income: incomeReportSchema,
  expenses: expensesReportSchema,
  "savings-rate": savingsRateSchema,
  "cutoff-comparison": cutoffComparisonSchema,
  "account-balances": accountBalancesSchema,
} as const;

export type ReportSchemas = typeof reportSchemas;
export type ReportData<N extends keyof ReportSchemas> = z.infer<ReportSchemas[N]>;

export const reportResSchema = <S extends z.ZodTypeAny>(data: S) =>
  resSchema.extend({
    data,
    meta: z.object({ from: z.string(), to: z.string() }),
  });

export type CashFlow = ReportData<"cash-flow">;
export type CategorySpending = ReportData<"category-spending">;
export type BudgetPerformance = ReportData<"budget-performance">;
export type IncomeReport = ReportData<"income">;
export type ExpensesReport = ReportData<"expenses">;
export type SavingsRate = ReportData<"savings-rate">;
export type CutoffComparison = ReportData<"cutoff-comparison">;
export type AccountBalances = ReportData<"account-balances">;
