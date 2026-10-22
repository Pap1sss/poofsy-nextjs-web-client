import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

export const CONTRIBUTION_TYPES = ["contribution", "withdrawal"] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

const optionSchema = z.object({ id: z.string(), name: z.string() });

// Matches the rows in SavingsGoalService::present().
export type Contribution = z.infer<typeof contributionSchema>;
export const contributionSchema = z.object({
  id: z.string(),
  type: z.enum(CONTRIBUTION_TYPES),
  amount: moneySchema,
  date: z.string(),
  notes: z.string().nullable(),
  transaction_id: z.string().nullable(),
});

// Matches SavingsGoalService::present().
export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
export const savingsGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  account: optionSchema.nullable(),
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
  contributions: z.array(contributionSchema),
});

// Matches SavingsGoalService::earmarkWarnings().
export type EarmarkWarning = z.infer<typeof earmarkWarningSchema>;
export const earmarkWarningSchema = z.object({
  account: optionSchema,
  earmarked: moneySchema,
  balance: moneySchema,
  over_by: moneySchema,
});

export const goalListResSchema = resSchema.extend({
  data: z.object({
    goals: z.array(savingsGoalSchema),
    warnings: z.array(earmarkWarningSchema),
  }),
});

export const goalResSchema = resSchema.extend({ data: savingsGoalSchema });

// Pickers: GET /accounts, GET /categories (only the fields this feature reads).
export const accountOptionsResSchema = resSchema.extend({
  data: z.array(optionSchema.extend({ archived_at: z.string().nullable() })),
});

export const categoryOptionsResSchema = resSchema.extend({
  data: z.array(
    optionSchema.extend({
      kind: z.enum(["spending", "savings", "investment"]),
      archived_at: z.string().nullable(),
    })
  ),
});

// Mirrors the validation in SavingsGoalController::validated().
export type GoalFormValues = z.infer<typeof GoalFormSchema>;
export const GoalFormSchema = z
  .object({
    name: z.string().trim().min(1, "Give the goal a name.").max(100),
    target_amount: z.string(),
    target_date: z.string(),
    account_id: z.string(),
    is_emergency_fund: z.boolean(),
    emergency_months: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.is_emergency_fund && !/[1-9]/.test(values.target_amount)) {
      ctx.addIssue({
        code: "custom",
        path: ["target_amount"],
        message: "Enter how much you want to save.",
      });
    }

    const months = Number(values.emergency_months);
    if (values.is_emergency_fund && (!Number.isInteger(months) || months < 1 || months > 24)) {
      ctx.addIssue({
        code: "custom",
        path: ["emergency_months"],
        message: "Choose between 1 and 24 months.",
      });
    }
  });

// Mirrors SavingsGoalController::contribute().
export type ContributionFormValues = z.infer<typeof ContributionFormSchema>;
export const ContributionFormSchema = z.object({
  type: z.enum(CONTRIBUTION_TYPES),
  amount: z.string().regex(/[1-9]/, "Enter an amount."),
  date: z.string().min(1, "Pick a date."),
  notes: z.string().max(500),
  move_money: z.boolean(),
  from_account_id: z.string(),
  category_id: z.string(),
});
