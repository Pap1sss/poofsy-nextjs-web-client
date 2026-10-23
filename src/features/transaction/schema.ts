import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { apiPaginatedResSchema, resSchema } from "@/lib/schemas";

import { ADJUSTMENT_DIRECTIONS, TRANSACTION_SORTS, TRANSACTION_TYPES } from "./constant";

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type AdjustmentDirection = (typeof ADJUSTMENT_DIRECTIONS)[number];
export type TransactionSort = (typeof TRANSACTION_SORTS)[number];

const namedRef = z.object({ id: z.string(), name: z.string() });

// Matches App\Http\Resources\TransactionResource.
export type Transaction = z.infer<typeof transactionSchema>;
export const transactionSchema = z.object({
  id: z.string(),
  type: z.enum(TRANSACTION_TYPES),
  amount: moneySchema,
  adjustment_direction: z.enum(ADJUSTMENT_DIRECTIONS).nullable(),
  transaction_date: z.string(),
  description: z.string(),
  notes: z.string().nullable(),
  account: namedRef.nullable().optional(),
  to_account: namedRef.nullable().optional(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
      kind: z.enum(["spending", "savings", "investment"]),
    })
    .nullable()
    .optional(),
  payment_method: namedRef.nullable().optional(),
  pay_period_id: z.string().nullable(),
  bill_occurrence_id: z.string().nullable(),
  from_income_record: z.boolean(),
  // A debt payment or a debt's opening movement; edited on the Debts page.
  from_debt: z.boolean(),
  // A PayLater payment's expense or a purchase's down payment; edited on the PayLater page.
  from_paylater: z.boolean(),
  attachments_count: z.number(),
  created_at: z.string().nullable(),
});

export const transactionListResSchema = resSchema.extend({
  data: apiPaginatedResSchema.extend({ data: z.array(transactionSchema) }),
});

export const transactionResSchema = resSchema.extend({ data: transactionSchema });

// Pickers. Only the fields the form and filters use; the API sends more (AccountResource etc.).
export type AccountOption = z.infer<typeof accountOptionSchema>;
export const accountOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  archived_at: z.string().nullable(),
});

export type CategoryOption = z.infer<typeof categoryOptionSchema>;
export const categoryOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["spending", "savings", "investment"]),
  color: z.string().nullable(),
  archived_at: z.string().nullable(),
});

export type PaymentMethodOption = z.infer<typeof paymentMethodOptionSchema>;
export const paymentMethodOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  archived_at: z.string().nullable(),
});

export const accountOptionsResSchema = resSchema.extend({ data: z.array(accountOptionSchema) });
export const categoryOptionsResSchema = resSchema.extend({ data: z.array(categoryOptionSchema) });
export const paymentMethodOptionsResSchema = resSchema.extend({
  data: z.array(paymentMethodOptionSchema),
});

// Matches AttachmentController::present().
export type Receipt = z.infer<typeof receiptSchema>;
export const receiptSchema = z.object({
  id: z.string(),
  original_name: z.string(),
  mime: z.string(),
  size: z.number(),
  url: z.string(),
  created_at: z.string().nullable(),
});

export const receiptListResSchema = resSchema.extend({ data: z.array(receiptSchema) });
export const receiptResSchema = resSchema.extend({ data: receiptSchema });

/** List filters, as IndexTransactionRequest accepts them. Empty values are left out of the query. */
export type TransactionFilters = {
  from?: string | null;
  to?: string | null;
  type?: TransactionType | null;
  account_id?: string | null;
  category_id?: string | null;
  payment_method_id?: string | null;
  search?: string | null;
  sort?: TransactionSort | null;
  page?: number | null;
  per_page?: number | null;
};

const AMOUNT = /^\d{1,15}(\.\d{1,4})?$/;

/** The "None – track only" account choice: an expense that counts as spending but moves no balance. Sent as null. */
export const TRACK_ONLY = "none";

// Mirrors TransactionRequest: which fields apply depends on the type.
export type TransactionFormValues = z.infer<typeof TransactionFormSchema>;
export const TransactionFormSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: z
      .string()
      .min(1, "Enter an amount.")
      .regex(AMOUNT, "Enter an amount like 250 or 250.50.")
      .refine((v) => /[1-9]/.test(v), "The amount must be more than zero."),
    account_id: z.string().min(1, "Choose an account."),
    to_account_id: z.string(),
    category_id: z.string(),
    payment_method_id: z.string(),
    adjustment_direction: z.enum(ADJUSTMENT_DIRECTIONS).or(z.literal("")),
    transaction_date: z.string().min(1, "Choose a date."),
    description: z.string().trim().min(1, "Describe what this was for.").max(255),
    notes: z.string().max(2000),
  })
  .superRefine((v, ctx) => {
    if (v.account_id === TRACK_ONLY && v.type !== "expense") {
      ctx.addIssue({
        code: "custom",
        path: ["account_id"],
        message: "Choose an account. Only expenses can be track-only.",
      });
    }

    if (v.type === "transfer") {
      if (!v.to_account_id) {
        ctx.addIssue({
          code: "custom",
          path: ["to_account_id"],
          message: "Choose where the money goes.",
        });
      } else if (v.to_account_id === v.account_id) {
        ctx.addIssue({
          code: "custom",
          path: ["to_account_id"],
          message: "Choose a different account to transfer into.",
        });
      }
    }

    if (v.type === "expense" && !v.category_id) {
      ctx.addIssue({
        code: "custom",
        path: ["category_id"],
        message: "Choose a category for this expense.",
      });
    }

    if (v.type === "adjustment" && !v.adjustment_direction) {
      ctx.addIssue({
        code: "custom",
        path: ["adjustment_direction"],
        message: "Choose whether the balance goes up or down.",
      });
    }
  });

/** The API payload: fields that don't apply to the type are sent as null (they're prohibited there). */
export function toTransactionPayload(v: TransactionFormValues) {
  return {
    type: v.type,
    amount: v.amount,
    account_id: v.account_id === TRACK_ONLY ? null : v.account_id,
    to_account_id: v.type === "transfer" ? v.to_account_id : null,
    category_id: v.type === "expense" || v.type === "transfer" ? v.category_id || null : null,
    payment_method_id: v.payment_method_id || null,
    adjustment_direction: v.type === "adjustment" ? v.adjustment_direction || null : null,
    transaction_date: v.transaction_date,
    description: v.description.trim(),
    notes: v.notes.trim() || null,
  };
}
