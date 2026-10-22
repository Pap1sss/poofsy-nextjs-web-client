import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { apiPaginatedResSchema, resSchema } from "@/lib/schemas";

const ref = z.object({ id: z.string(), name: z.string() });

// Matches App\Http\Resources\IncomeRecordResource.
export type IncomeRecord = z.infer<typeof incomeRecordSchema>;
export const incomeRecordSchema = z.object({
  id: z.string(),
  income_source: ref.nullable(),
  account: ref.nullable(),
  pay_period_id: z.string().nullable(),
  pay_date: z.string(),
  gross: moneySchema,
  deductions_total: moneySchema,
  net: moneySchema,
  deductions: z.array(
    z.object({ id: z.string(), deduction_type: ref.nullable(), amount: moneySchema })
  ),
  transaction_id: z.string().nullable(),
  notes: z.string().nullable(),
});

export const incomeRecordListResSchema = resSchema.extend({
  data: apiPaginatedResSchema.extend({ data: z.array(incomeRecordSchema) }),
});
export const incomeRecordResSchema = resSchema.extend({ data: incomeRecordSchema });

// Matches App\Http\Resources\IncomeSourceResource.
export type IncomeSource = z.infer<typeof incomeSourceSchema>;
export const incomeSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  expected_gross: moneySchema,
  expected_net: moneySchema,
  frequency: z.string(),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
  previous_version_id: z.string().nullable(),
});

export const incomeSourceListResSchema = resSchema.extend({ data: z.array(incomeSourceSchema) });
export const incomeSourceResSchema = resSchema.extend({ data: incomeSourceSchema });

// Pickers. Zod strips the fields we don't use from the full resources.
export type AccountOption = z.infer<typeof accountOptionSchema>;
const accountOptionSchema = z.object({ id: z.string(), name: z.string() });
export const accountOptionsResSchema = resSchema.extend({ data: z.array(accountOptionSchema) });

export type DeductionTypeOption = z.infer<typeof deductionTypeOptionSchema>;
const deductionTypeOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  default_amount: moneySchema.nullable(),
});
export const deductionTypeOptionsResSchema = resSchema.extend({
  data: z.array(deductionTypeOptionSchema),
});

export type PayPeriodOption = z.infer<typeof payPeriodOptionSchema>;
const payPeriodOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  start_date: z.string(),
  end_date: z.string(),
});
export const payPeriodOptionsResSchema = resSchema.extend({ data: z.array(payPeriodOptionSchema) });

const amount = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, "Enter an amount, like 1500 or 1500.50.");

// Mirrors IncomeRecordRequest. Net is never sent: the API works it out from gross and deductions.
export type IncomeRecordFormValues = z.infer<typeof IncomeRecordFormSchema>;
export const IncomeRecordFormSchema = z.object({
  income_source_id: z.string(),
  account_id: z.string().min(1, "Choose the account the money went into."),
  pay_date: z.string().min(1, "Enter the pay date."),
  gross: amount.refine((v) => /[1-9]/.test(v), "Gross pay must be more than zero."),
  deductions: z.array(z.object({ deduction_type_id: z.string(), amount })).max(20),
  notes: z.string().max(2000),
});

export const toIncomeRecordPayload = (values: IncomeRecordFormValues) => ({
  income_source_id: values.income_source_id || null,
  account_id: values.account_id,
  pay_date: values.pay_date,
  gross: values.gross,
  deductions: values.deductions.map((line) => ({
    deduction_type_id: line.deduction_type_id || null,
    amount: line.amount,
  })),
  notes: values.notes.trim() || null,
});

// Mirrors IncomeSourceRequest.
export type IncomeSourceFormValues = z.infer<typeof IncomeSourceFormSchema>;
export const IncomeSourceFormSchema = z.object({
  name: z.string().trim().min(1, "Give this income a name.").max(100),
  type: z.string().min(1),
  expected_gross: amount,
  expected_net: amount,
  frequency: z.string().min(1),
  effective_from: z.string().min(1, "Enter the date this pay started."),
});

export type PayChangeFormValues = z.infer<typeof PayChangeFormSchema>;
export const PayChangeFormSchema = z.object({
  expected_gross: amount,
  expected_net: amount,
  effective_from: z.string().min(1, "Enter the date the new pay starts."),
});
