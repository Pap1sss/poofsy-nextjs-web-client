import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

import { INSTALLMENT_STATUSES, PURCHASE_STATUSES, RECORD_AS } from "./constant";

export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
export type RecordAs = (typeof RECORD_AS)[number];

const optionSchema = z.object({ id: z.string(), name: z.string() });
const categoryOptionSchema = optionSchema.extend({ color: z.string().nullable() });

const providerSchema = z.object({
  id: z.string(),
  provider_name: z.string(),
  nickname: z.string().nullable(),
});
export type Provider = z.infer<typeof providerSchema>;

// Matches PaylaterService::presentInstallment().
export type Installment = z.infer<typeof installmentSchema>;
export const installmentSchema = z.object({
  id: z.string(),
  number: z.number(),
  due_date: z.string(),
  amount: moneySchema,
  paid: moneySchema,
  remaining: moneySchema,
  status: z.enum(INSTALLMENT_STATUSES),
  paid_dates: z.array(z.string()),
});

// Installments across purchases (timeline, next payment): PaylaterService::presentUnpaid().
export type ScheduledInstallment = z.infer<typeof scheduledInstallmentSchema>;
export const scheduledInstallmentSchema = installmentSchema.extend({
  installment_count: z.number(),
  purchase: z.object({ id: z.string(), description: z.string() }),
  provider: providerSchema,
});

// Matches PaylaterService::presentPayment().
export type Payment = z.infer<typeof paymentSchema>;
export const paymentSchema = z.object({
  id: z.string(),
  paylater_account_id: z.string(),
  scope: z.enum(["installment", "purchase", "account"]),
  amount: moneySchema,
  amount_here: moneySchema.nullable(),
  installment_numbers: z.array(z.number()),
  payment_date: z.string(),
  payment_method: optionSchema.nullable(),
  reference_number: z.string().nullable(),
  notes: z.string().nullable(),
  record_as: z.enum(RECORD_AS),
  account: optionSchema.nullable(),
  category: categoryOptionSchema.nullable(),
  transaction_id: z.string().nullable(),
  voided_at: z.string().nullable(),
  void_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});

export type PaylaterEvent = z.infer<typeof eventSchema>;
export const eventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "created",
    "updated",
    "schedule_changed",
    "payment_recorded",
    "payment_corrected",
    "payment_voided",
    "cancelled",
    "reopened",
  ]),
  properties: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().nullable(),
});

// Matches PaylaterService::presentPurchase().
export type Purchase = z.infer<typeof purchaseSchema>;
export const purchaseSchema = z.object({
  id: z.string(),
  account: providerSchema,
  category: categoryOptionSchema.nullable(),
  description: z.string(),
  merchant: z.string().nullable(),
  order_reference: z.string().nullable(),
  purchase_date: z.string(),
  original_amount: moneySchema,
  down_payment: moneySchema,
  financed_amount: moneySchema,
  fees: moneySchema,
  other_charges: moneySchema,
  interest_rate: z.number().nullable(),
  total_charges: moneySchema,
  total_repayment: moneySchema,
  paid: moneySchema,
  remaining: moneySchema,
  progress_percent: z.number(),
  installment_count: z.number(),
  paid_installments: z.number(),
  next_due: z
    .object({
      installment_id: z.string(),
      number: z.number(),
      due_date: z.string(),
      amount: moneySchema,
    })
    .nullable(),
  status: z.enum(PURCHASE_STATUSES),
  frequency: z.string(),
  down_payment_recorded: z.boolean(),
  notes: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});

export type PurchaseDetail = z.infer<typeof purchaseDetailSchema>;
export const purchaseDetailSchema = purchaseSchema.extend({
  installments: z.array(installmentSchema),
  payments: z.array(paymentSchema),
  events: z.array(eventSchema),
});

// Matches PaylaterService::presentAccount().
export type PaylaterAccount = z.infer<typeof accountSchema>;
export const accountSchema = providerSchema.extend({
  credit_limit: moneySchema.nullable(),
  available_credit: moneySchema.nullable(),
  available_is_estimate: z.boolean(),
  due_day: z.number().nullable(),
  outstanding: moneySchema,
  overdue: moneySchema,
  due_this_month: moneySchema,
  purchases_count: z.number(),
  open_purchases_count: z.number(),
  notes: z.string().nullable(),
  archived_at: z.string().nullable(),
});

export type PaylaterAccountDetail = z.infer<typeof accountDetailSchema>;
export const accountDetailSchema = accountSchema.extend({
  purchases: z.array(purchaseSchema),
  payments: z.array(paymentSchema),
});

export type PaylaterPrefs = z.infer<typeof prefsSchema>;
export const prefsSchema = z.object({
  reminder_days_before: z.number().nullable(),
  remind_due_today: z.boolean(),
  remind_overdue: z.boolean(),
  monthly_limit: moneySchema.nullable(),
  budget_percent: z.number().nullable(),
});

// Matches PaylaterService::dashboard().
export type PaylaterOverview = z.infer<typeof overviewSchema>;
export const overviewSchema = z.object({
  summary: z.object({
    total_outstanding: moneySchema,
    due_this_month: moneySchema,
    overdue: moneySchema,
    overdue_count: z.number(),
    total_paid: moneySchema,
    total_charges: moneySchema,
    available_credit: moneySchema.nullable(),
    available_is_estimate: z.boolean(),
    next_bill: z
      .object({
        due_date: z.string(),
        amount: moneySchema,
        count: z.number(),
        providers: z.array(providerSchema),
      })
      .nullable(),
    open_purchases_count: z.number(),
  }),
  accounts: z.array(accountSchema),
  months: z.array(
    z.object({
      month: z.string(),
      scheduled: moneySchema,
      remaining: moneySchema,
      count: z.number(),
      over_limit: z.boolean(),
    })
  ),
  upcoming: z.array(scheduledInstallmentSchema),
  recent_payments: z.array(paymentSchema.extend({ provider: providerSchema })),
  warnings: z.array(
    z.object({
      type: z.literal("heavy_month"),
      month: z.string(),
      amount: moneySchema,
      limit: moneySchema,
    })
  ),
  prefs: prefsSchema,
});

export const overviewResSchema = resSchema.extend({ data: overviewSchema });
export const purchaseListResSchema = resSchema.extend({
  data: z.object({
    totals: z.object({ remaining: moneySchema, paid: moneySchema, count: z.number() }),
    purchases: z.array(purchaseSchema),
  }),
});
export const purchaseResSchema = resSchema.extend({ data: purchaseDetailSchema });
export const accountListResSchema = resSchema.extend({ data: z.array(accountSchema) });
export const accountResSchema = resSchema.extend({ data: accountDetailSchema });
export const paymentResSchema = resSchema.extend({ data: paymentSchema });
export const installmentListResSchema = resSchema.extend({
  data: z.array(scheduledInstallmentSchema),
});
export const prefsResSchema = resSchema.extend({ data: prefsSchema });
export const previewResSchema = resSchema.extend({
  data: z.object({
    suggested_total: moneySchema,
    total_repayment: moneySchema,
    installments: z.array(
      z.object({ number: z.number(), due_date: z.string(), amount: moneySchema })
    ),
  }),
});

// Pickers: GET /accounts, /categories, /payment-methods, /transactions (only the fields used here).
export const accountOptionsResSchema = resSchema.extend({ data: z.array(optionSchema) });
export const categoryOptionsResSchema = resSchema.extend({
  data: z.array(
    categoryOptionSchema.extend({ kind: z.enum(["spending", "savings", "investment"]) })
  ),
});
export const paymentMethodOptionsResSchema = resSchema.extend({ data: z.array(optionSchema) });
export const expenseOptionsResSchema = resSchema.extend({
  data: z.object({
    data: z.array(
      z.object({
        id: z.string(),
        description: z.string(),
        amount: moneySchema,
        transaction_date: z.string(),
        bill_occurrence_id: z.string().nullable(),
        from_income_record: z.boolean(),
        from_debt: z.boolean(),
        from_paylater: z.boolean(),
      })
    ),
  }),
});

export type PurchaseFilters = {
  account_id: string | null;
  status: string;
  installment_status: string | null;
  search: string | null;
  from: string | null;
  to: string | null;
  due_from: string | null;
  due_to: string | null;
  sort: string;
};

const amountRule = z.string().regex(/[1-9]/, "Enter an amount.");
const optionalAmount = z.string();

// Mirrors App\Http\Requests\Paylater\PaylaterAccountRequest.
export type AccountFormValues = z.infer<typeof AccountFormSchema>;
export const AccountFormSchema = z.object({
  provider_name: z.string().trim().min(1, "Choose or type a provider.").max(100),
  nickname: z.string().max(100),
  credit_limit: optionalAmount,
  available_credit: optionalAmount,
  due_day: z.string().regex(/^$|^([1-9]|[12][0-9]|3[01])$/, "Pick a day from 1 to 31."),
  notes: z.string().max(2000),
});

const scheduleRowSchema = z.object({
  id: z.string().optional(),
  due_date: z.string().min(1, "Pick a due date."),
  amount: amountRule,
});
export type ScheduleRow = z.infer<typeof scheduleRowSchema>;

// Mirrors App\Http\Requests\Paylater\PaylaterPurchaseRequest (create).
export type PurchaseFormValues = z.infer<typeof PurchaseFormSchema>;
export const PurchaseFormSchema = z.object({
  paylater_account_id: z.string().min(1, "Choose the PayLater account."),
  category_id: z.string().optional(),
  description: z.string().trim().min(1, "Say what you bought.").max(255),
  merchant: z.string().max(150),
  order_reference: z.string().max(100),
  purchase_date: z.string().min(1, "Pick a date."),
  original_amount: amountRule,
  down_payment: optionalAmount,
  fees: optionalAmount,
  other_charges: optionalAmount,
  interest_rate: z.string(),
  total_repayment: amountRule,
  installment_count: z.string(),
  first_due_date: z.string(),
  installments: z.array(scheduleRowSchema).min(1, "Fill in the schedule."),
  record_down_payment: z.boolean(),
  down_payment_account_id: z.string().optional(),
  notes: z.string().max(2000),
});

// The details form on an existing purchase (no schedule: that has its own editor).
export type PurchaseDetailsValues = z.infer<typeof PurchaseDetailsSchema>;
export const PurchaseDetailsSchema = PurchaseFormSchema.pick({
  paylater_account_id: true,
  category_id: true,
  description: true,
  merchant: true,
  order_reference: true,
  purchase_date: true,
  original_amount: true,
  down_payment: true,
  fees: true,
  other_charges: true,
  interest_rate: true,
  notes: true,
});

export type ScheduleFormValues = z.infer<typeof ScheduleFormSchema>;
export const ScheduleFormSchema = z.object({
  total_repayment: amountRule,
  installments: z.array(scheduleRowSchema).min(1, "Keep at least one installment."),
});

// Mirrors App\Http\Requests\Paylater\PaylaterPaymentRequest.
export type PaymentFormValues = z.infer<typeof PaymentFormSchema>;
export const PaymentFormSchema = z.object({
  amount: amountRule,
  payment_date: z.string().min(1, "Pick a date."),
  payment_method_id: z.string().optional(),
  reference_number: z.string().max(100),
  notes: z.string().max(2000),
  record_as: z.enum(RECORD_AS),
  // Optional: shown only for some choices, and an unmounted field reads as undefined.
  account_id: z.string().optional(),
  category_id: z.string().optional(),
  transaction_id: z.string().optional(),
});

export type PrefsFormValues = z.infer<typeof PrefsFormSchema>;
export const PrefsFormSchema = z.object({
  reminders_on: z.boolean(),
  reminder_days_before: z.string(),
  remind_due_today: z.boolean(),
  remind_overdue: z.boolean(),
  monthly_limit: z.string(),
  budget_percent: z.string(),
});
