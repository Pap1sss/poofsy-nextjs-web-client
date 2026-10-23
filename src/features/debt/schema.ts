import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

import { DEBT_DIRECTIONS, DEBT_STATUSES, RECORD_AS } from "./constant";

export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];
export type DebtStatus = (typeof DEBT_STATUSES)[number];
export type RecordAs = (typeof RECORD_AS)[number];

const optionSchema = z.object({ id: z.string(), name: z.string() });

// Matches DebtService::presentSettlement().
export type Settlement = z.infer<typeof settlementSchema>;
export const settlementSchema = z.object({
  id: z.string(),
  amount: moneySchema,
  settlement_date: z.string(),
  payment_method: optionSchema.nullable(),
  reference_number: z.string().nullable(),
  notes: z.string().nullable(),
  record_as: z.enum(RECORD_AS),
  account: optionSchema.nullable(),
  transaction_id: z.string().nullable(),
  voided_at: z.string().nullable(),
  void_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});

// Matches the history rows in DebtService::present(). Properties carry numbers; the UI words them.
export type DebtEvent = z.infer<typeof debtEventSchema>;
export const debtEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "created",
    "updated",
    "settlement_recorded",
    "settlement_corrected",
    "settlement_voided",
    "cancelled",
    "reopened",
  ]),
  properties: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().nullable(),
});

// Matches DebtService::present().
export type Debt = z.infer<typeof debtSchema>;
export const debtSchema = z.object({
  id: z.string(),
  person: optionSchema,
  direction: z.enum(DEBT_DIRECTIONS),
  description: z.string(),
  notes: z.string().nullable(),
  reference_number: z.string().nullable(),
  original_amount: moneySchema,
  settled: moneySchema,
  remaining: moneySchema,
  progress_percent: z.number(),
  debt_date: z.string(),
  due_date: z.string().nullable(),
  status: z.enum(DEBT_STATUSES),
  settlements_count: z.number(),
  last_settlement_date: z.string().nullable(),
  opening_account: optionSchema.nullable(),
  cancelled_at: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});

// Show, store, update and the settlement actions return the debt with its history.
export type DebtDetail = z.infer<typeof debtDetailSchema>;
export const debtDetailSchema = debtSchema.extend({
  settlements: z.array(settlementSchema),
  events: z.array(debtEventSchema),
});

export type DebtSummary = z.infer<typeof debtSummarySchema>;
export const debtSummarySchema = z.object({
  total_receivables: moneySchema,
  total_payables: moneySchema,
  net_position: moneySchema,
  overdue_receivables: moneySchema,
  overdue_payables: moneySchema,
  open_receivables_count: z.number(),
  open_payables_count: z.number(),
  overdue_count: z.number(),
  settled_count: z.number(),
});

export const debtListResSchema = resSchema.extend({
  data: z.object({
    summary: debtSummarySchema,
    due_soon: z.array(debtSchema),
    debts: z.array(debtSchema),
  }),
});

export const debtResSchema = resSchema.extend({ data: debtDetailSchema });

// Matches DebtService::personTotals(): the two directions are never netted.
const directionTotalsSchema = z.object({
  original: moneySchema,
  settled: moneySchema,
  remaining: moneySchema,
  open_count: z.number(),
});
export type PersonTotals = z.infer<typeof personTotalsSchema>;
export const personTotalsSchema = z.object({
  receivable: directionTotalsSchema,
  payable: directionTotalsSchema,
});

export type PersonSummary = z.infer<typeof personSummarySchema>;
export const personSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  debts_count: z.number(),
  totals: personTotalsSchema,
});

export const peopleResSchema = resSchema.extend({ data: z.array(personSummarySchema) });

export type PersonSettlement = z.infer<typeof personSettlementSchema>;
export const personSettlementSchema = settlementSchema.extend({
  debt: z.object({ id: z.string(), description: z.string(), direction: z.enum(DEBT_DIRECTIONS) }),
});

export type PersonDetail = z.infer<typeof personDetailSchema>;
export const personDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  totals: personTotalsSchema,
  debts: z.array(debtSchema),
  settlements: z.array(personSettlementSchema),
});

export const personResSchema = resSchema.extend({ data: personDetailSchema });

// Pickers: GET /accounts, /categories, /payment-methods (only the fields this feature reads).
export const accountOptionsResSchema = resSchema.extend({ data: z.array(optionSchema) });
export const categoryOptionsResSchema = resSchema.extend({
  data: z.array(
    optionSchema.extend({
      kind: z.enum(["spending", "savings", "investment"]),
      color: z.string().nullable(),
    })
  ),
});
export const paymentMethodOptionsResSchema = resSchema.extend({ data: z.array(optionSchema) });

export type DebtFilters = {
  direction: DebtDirection | null;
  status: DebtStatus | "open" | "all";
  due: string | null;
  from: string | null;
  to: string | null;
  search: string | null;
  person_id?: string | null;
  sort: string;
};

const amountRule = z.string().regex(/[1-9]/, "Enter an amount.");

// Mirrors App\Http\Requests\Debt\DebtRequest.
export type DebtFormValues = z.infer<typeof DebtFormSchema>;
export const DebtFormSchema = z
  .object({
    // Optional: these fields come and go as the form switches between them, and an unmounted field reads as undefined.
    person_id: z.string().optional(),
    person_name: z.string().max(100).optional(),
    direction: z.enum(DEBT_DIRECTIONS),
    original_amount: amountRule,
    debt_date: z.string().min(1, "Pick a date."),
    due_date: z.string(),
    description: z.string().trim().min(1, "Say what this debt is for.").max(255),
    notes: z.string().max(2000),
    reference_number: z.string().max(100),
    record_in_account: z.boolean(),
    account_id: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.person_id && !values.person_name?.trim()) {
      ctx.addIssue({ code: "custom", path: ["person_id"], message: "Choose or add a person." });
    }
    if (values.due_date && values.debt_date && values.due_date < values.debt_date) {
      ctx.addIssue({
        code: "custom",
        path: ["due_date"],
        message: "The due date can't be before the date of the debt.",
      });
    }
    if (values.record_in_account && !values.account_id) {
      ctx.addIssue({
        code: "custom",
        path: ["account_id"],
        message: "Choose the account the money moved in or out of.",
      });
    }
  });

// Mirrors App\Http\Requests\Debt\SettlementRequest.
export type SettlementFormValues = z.infer<typeof SettlementFormSchema>;
export const SettlementFormSchema = z.object({
  amount: amountRule,
  settlement_date: z.string().min(1, "Pick a date."),
  payment_method_id: z.string(),
  reference_number: z.string().max(100),
  notes: z.string().max(2000),
  record_as: z.enum(RECORD_AS),
  // Optional: shown only for some choices, and an unmounted field reads as undefined.
  account_id: z.string().optional(),
  category_id: z.string().optional(),
});

export type PersonFormValues = z.infer<typeof PersonFormSchema>;
export const PersonFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(100),
  notes: z.string().max(2000),
});
