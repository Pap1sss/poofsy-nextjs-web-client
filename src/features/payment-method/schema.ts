import { z } from "zod";

import { resSchema } from "@/lib/schemas";

// Matches PaymentMethodController::present().
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  account: z.object({ id: z.string(), name: z.string() }).nullable(),
  sort_order: z.number(),
  archived_at: z.string().nullable(),
});

export const paymentMethodListResSchema = resSchema.extend({ data: z.array(paymentMethodSchema) });
export const paymentMethodResSchema = resSchema.extend({ data: paymentMethodSchema });

export const NO_ACCOUNT = "none";

export type PaymentMethodFormValues = z.infer<typeof PaymentMethodFormSchema>;
export const PaymentMethodFormSchema = z.object({
  name: z.string().trim().min(1, "Give the payment method a name.").max(60),
  // NO_ACCOUNT when it isn't tied to one account.
  account_id: z.string(),
});
