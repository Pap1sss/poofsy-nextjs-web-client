import { z } from "zod";

import { resSchema } from "@/lib/schemas";
import { userSettingsSchema } from "@/features/auth/schema/auth";

export const PAY_SCHEDULE_TYPES = ["weekly", "biweekly", "semi_monthly", "monthly"] as const;
export const WEEKEND_RULES = [
  "previous_business_day",
  "next_business_day",
  "as_scheduled",
] as const;

export type PayScheduleType = (typeof PAY_SCHEDULE_TYPES)[number];
export type WeekendRule = (typeof WEEKEND_RULES)[number];

// Matches OnboardingController::presets().
export type Preset = z.infer<typeof presetSchema>;
export const presetSchema = z.object({
  key: z.string(),
  name: z.string(),
  currency: z.string(),
  locale: z.string(),
  timezone: z.string(),
  pay_schedule: z.object({
    type: z.enum(PAY_SCHEDULE_TYPES),
    pay_days: z.array(z.number()),
    weekend_rule: z.enum(WEEKEND_RULES),
  }),
});

export const presetsResSchema = resSchema.extend({ data: z.array(presetSchema) });
export const completeOnboardingResSchema = resSchema.extend({ data: userSettingsSchema });

// Mirrors CompleteOnboardingRequest. `regular_pay: false` sends pay_schedule: null (irregular income).
export type OnboardingValues = z.infer<typeof OnboardingSchema>;
export const OnboardingSchema = z
  .object({
    preset: z.string().min(1, "Choose where you're based."),
    currency: z.string().length(3, "Choose a currency."),
    timezone: z.string().min(1, "Choose a time zone."),
    regular_pay: z.boolean(),
    pay_schedule: z.object({
      type: z.enum(PAY_SCHEDULE_TYPES),
      pay_days: z.array(z.number().int().min(1).max(31)),
      anchor_date: z.string(),
      weekend_rule: z.enum(WEEKEND_RULES),
    }),
  })
  .superRefine(({ regular_pay, pay_schedule: schedule }, ctx) => {
    if (!regular_pay) return;

    const usesAnchor = schedule.type === "weekly" || schedule.type === "biweekly";

    if (usesAnchor && !schedule.anchor_date) {
      ctx.addIssue({
        code: "custom",
        path: ["pay_schedule", "anchor_date"],
        message: "Pick a recent payday so we know which day of the week you're paid.",
      });
    }

    if (schedule.type === "semi_monthly" && schedule.pay_days[0] === schedule.pay_days[1]) {
      ctx.addIssue({
        code: "custom",
        path: ["pay_schedule", "pay_days"],
        message: "Pick two different days.",
      });
    }
  });

/** The API payload: only the schedule fields that apply to the chosen type. */
export function toOnboardingPayload(values: OnboardingValues) {
  const { regular_pay, pay_schedule: schedule, ...rest } = values;

  if (!regular_pay) return { ...rest, pay_schedule: null };

  const usesAnchor = schedule.type === "weekly" || schedule.type === "biweekly";

  return {
    ...rest,
    pay_schedule: {
      type: schedule.type,
      weekend_rule: schedule.weekend_rule,
      ...(usesAnchor
        ? { anchor_date: schedule.anchor_date }
        : {
            pay_days:
              schedule.type === "monthly" ? schedule.pay_days.slice(0, 1) : schedule.pay_days,
          }),
    },
  };
}
