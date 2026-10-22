import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

export const ACCOUNT_TYPES = [
  "cash",
  "bank",
  "e_wallet",
  "credit_card",
  "savings",
  "investment",
  "loan",
  "other",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Cash",
  bank: "Bank",
  e_wallet: "E-wallet",
  credit_card: "Credit card",
  savings: "Savings",
  investment: "Investment",
  loan: "Loan",
  other: "Other",
};

// Matches App\Http\Resources\AccountResource.
export type Account = z.infer<typeof accountSchema>;
export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.string(),
  starting_balance: moneySchema,
  current_balance: moneySchema,
  notes: z.string().nullable(),
  sort_order: z.number(),
  archived_at: z.string().nullable(),
  created_at: z.string().nullable(),
});

export const accountListResSchema = resSchema.extend({ data: z.array(accountSchema) });
export const accountResSchema = resSchema.extend({ data: accountSchema });

export const reconcileResSchema = resSchema.extend({
  data: z.object({
    statement_balance: moneySchema,
    ledger_balance: moneySchema,
    difference: moneySchema,
    adjustment_transaction_id: z.string().nullable(),
    account: accountSchema,
  }),
});
export type ReconcileResult = z.infer<typeof reconcileResSchema>["data"];

export type AccountFormValues = z.infer<typeof AccountFormSchema>;
export const AccountFormSchema = z.object({
  name: z.string().trim().min(1, "Give the account a name.").max(100),
  type: z.enum(ACCOUNT_TYPES),
  starting_balance: z.string(),
  // CurrencyInput only takes unsigned amounts; this flips the sign for cards and loans.
  below_zero: z.boolean(),
  notes: z.string().max(2000),
});

/** "500" + below zero -> "-500"; blank -> "0". */
export const signedAmount = (amount: string, belowZero: boolean) => {
  const value = amount === "" ? "0" : amount;
  return belowZero && /[1-9]/.test(value) ? `-${value}` : value;
};
