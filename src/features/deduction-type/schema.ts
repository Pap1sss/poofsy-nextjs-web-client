import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

// Matches DeductionTypeController::present().
export type DeductionType = z.infer<typeof deductionTypeSchema>;
export const deductionTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  default_amount: moneySchema.nullable(),
  sort_order: z.number(),
  archived_at: z.string().nullable(),
});

export const deductionTypeListResSchema = resSchema.extend({ data: z.array(deductionTypeSchema) });
export const deductionTypeResSchema = resSchema.extend({ data: deductionTypeSchema });

export type DeductionTypeFormValues = z.infer<typeof DeductionTypeFormSchema>;
export const DeductionTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Give the deduction a name.").max(60),
  // Blank = no default; the payslip form starts at zero for it.
  default_amount: z.string(),
});
