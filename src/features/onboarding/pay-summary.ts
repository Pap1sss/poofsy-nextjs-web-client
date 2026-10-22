import type { OnboardingValues } from "./schema";

const ordinal = (day: number) => {
  const suffix =
    day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th");
  return `${day}${suffix}`;
};

// 31 means "last day"; 29 and 30 move to the month's last day when it's shorter (plan §9).
export const dayLabel = (day: number) => (day === 31 ? "the last day" : `the ${ordinal(day)}`);

const utcDate = (isoDate: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );

const weekday = (isoDate: string) => utcDate(isoDate, { weekday: "long" });

const WEEKEND: Record<OnboardingValues["pay_schedule"]["weekend_rule"], string> = {
  previous_business_day: "When a payday lands on a weekend, you get paid the business day before.",
  next_business_day: "When a payday lands on a weekend, you get paid the business day after.",
  as_scheduled: "Weekend paydays stay on the weekend.",
};

/** Says the schedule back the way a person would describe it, so a wrong pick is easy to spot. */
export function describePaySchedule({
  regular_pay,
  pay_schedule: s,
}: Pick<OnboardingValues, "regular_pay" | "pay_schedule">) {
  if (!regular_pay) {
    return "Your income doesn't arrive on fixed paydays. You'll budget month by month, or each time money comes in.";
  }

  const [first, second] = s.pay_days;
  const shortMonth = s.pay_days.some((day) => day === 29 || day === 30)
    ? " In shorter months, the 29th and 30th become the last day."
    : "";

  const when = (() => {
    switch (s.type) {
      case "semi_monthly":
        return `You're paid twice a month, on ${dayLabel(first)} and on ${dayLabel(second)}.`;
      case "monthly":
        return `You're paid once a month, on ${dayLabel(first)}.`;
      case "weekly":
        return s.anchor_date
          ? `You're paid every ${weekday(s.anchor_date)}.`
          : "You're paid every week.";
      case "biweekly":
        return s.anchor_date
          ? `You're paid every other ${weekday(s.anchor_date)}, counting from ${utcDate(s.anchor_date, { dateStyle: "medium" })}.`
          : "You're paid every two weeks.";
    }
  })();

  return `${when}${shortMonth} ${WEEKEND[s.weekend_rule]}`;
}
