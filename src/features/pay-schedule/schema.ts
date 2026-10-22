import { z } from "zod";

import { resSchema } from "@/lib/schemas";
import { describePaySchedule } from "@/features/onboarding/pay-summary";
import { PAY_SCHEDULE_TYPES, WEEKEND_RULES } from "@/features/onboarding/schema";

// Matches App\Http\Resources\PayScheduleResource. "custom" exists in the API but isn't offered here.
export type PaySchedule = z.infer<typeof payScheduleSchema>;
export const payScheduleSchema = z.object({
  id: z.string(),
  type: z.string(),
  pay_days: z.array(z.number()).nullable(),
  anchor_date: z.string().nullable(),
  interval_days: z.number().nullable(),
  weekend_rule: z.enum(WEEKEND_RULES),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
});

export const payScheduleListResSchema = resSchema.extend({ data: z.array(payScheduleSchema) });
export const payScheduleResSchema = resSchema.extend({ data: payScheduleSchema });
export const paydayPreviewResSchema = resSchema.extend({ data: z.array(z.string()) });

// Mirrors PayScheduleRequest.
export type PayScheduleFormValues = z.infer<typeof PayScheduleFormSchema>;
export const PayScheduleFormSchema = z
  .object({
    type: z.enum(PAY_SCHEDULE_TYPES),
    pay_days: z.array(z.number().int().min(1).max(31)),
    anchor_date: z.string(),
    weekend_rule: z.enum(WEEKEND_RULES),
    effective_from: z.string().min(1, "Choose the date the new schedule starts."),
  })
  .superRefine((values, ctx) => {
    if (usesAnchor(values.type) && !values.anchor_date) {
      ctx.addIssue({
        code: "custom",
        path: ["anchor_date"],
        message: "Pick a recent payday so we know which day of the week you're paid.",
      });
    }

    if (values.type === "semi_monthly" && values.pay_days[0] === values.pay_days[1]) {
      ctx.addIssue({ code: "custom", path: ["pay_days"], message: "Pick two different days." });
    }
  });

export const usesAnchor = (type: string) => type === "weekly" || type === "biweekly";

/** Only the fields that apply to the chosen type, as the API expects them. */
export function toPaySchedulePayload(values: PayScheduleFormValues) {
  return {
    type: values.type,
    weekend_rule: values.weekend_rule,
    effective_from: values.effective_from || undefined,
    ...(usesAnchor(values.type)
      ? { anchor_date: values.anchor_date }
      : { pay_days: values.type === "monthly" ? values.pay_days.slice(0, 1) : values.pay_days }),
  };
}

/** True when the API can preview these values (so we don't ask while a field is half-filled). */
export const isPreviewable = (values: PayScheduleFormValues) =>
  PayScheduleFormSchema.safeParse({ ...values, effective_from: values.effective_from || "x" })
    .success;

/** The onboarding sentence for a stored schedule ("You're paid twice a month, on the 15th..."). */
export function describeSchedule(schedule: PaySchedule) {
  if (!(PAY_SCHEDULE_TYPES as readonly string[]).includes(schedule.type)) {
    return `You're paid on set days each month (${(schedule.pay_days ?? []).join(", ")}).`;
  }

  return describePaySchedule({
    regular_pay: true,
    pay_schedule: {
      type: schedule.type as PayScheduleFormValues["type"],
      pay_days: schedule.pay_days ?? [],
      anchor_date: schedule.anchor_date ?? "",
      weekend_rule: schedule.weekend_rule,
    },
  });
}
