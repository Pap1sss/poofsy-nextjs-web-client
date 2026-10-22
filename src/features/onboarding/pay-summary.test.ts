import { describe, expect, it } from "vitest";

import { dayLabel, describePaySchedule } from "./pay-summary";
import { toOnboardingPayload, type OnboardingValues } from "./schema";

type Schedule = OnboardingValues["pay_schedule"];

const schedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  type: "semi_monthly",
  pay_days: [15, 31],
  anchor_date: "",
  weekend_rule: "previous_business_day",
  ...overrides,
});

describe("dayLabel", () => {
  it.each([
    [1, "the 1st"],
    [2, "the 2nd"],
    [3, "the 3rd"],
    [11, "the 11th"],
    [12, "the 12th"],
    [13, "the 13th"],
    [15, "the 15th"],
    [22, "the 22nd"],
    [31, "the last day"],
  ])("%i -> %s", (day, label) => expect(dayLabel(day)).toBe(label));
});

describe("describePaySchedule", () => {
  it("says the PH 15th / last-day schedule back in plain words", () => {
    expect(describePaySchedule({ regular_pay: true, pay_schedule: schedule() })).toBe(
      "You're paid twice a month, on the 15th and on the last day. When a payday lands on a weekend, you get paid the business day before."
    );
  });

  it("notes that the 29th and 30th become the last day in short months", () => {
    const text = describePaySchedule({
      regular_pay: true,
      pay_schedule: schedule({ type: "monthly", pay_days: [30] }),
    });

    expect(text).toContain("You're paid once a month, on the 30th.");
    expect(text).toContain("In shorter months, the 29th and 30th become the last day.");
  });

  it.each([
    ["next_business_day", "you get paid the business day after."],
    ["as_scheduled", "Weekend paydays stay on the weekend."],
  ] as const)("describes the %s weekend rule", (rule, sentence) => {
    expect(
      describePaySchedule({ regular_pay: true, pay_schedule: schedule({ weekend_rule: rule }) })
    ).toContain(sentence);
  });

  it("names the weekday for weekly and biweekly pay (2026-10-02 is a Friday)", () => {
    expect(
      describePaySchedule({
        regular_pay: true,
        pay_schedule: schedule({ type: "weekly", anchor_date: "2026-10-02" }),
      })
    ).toMatch(/^You're paid every Friday\./);

    expect(
      describePaySchedule({
        regular_pay: true,
        pay_schedule: schedule({ type: "biweekly", anchor_date: "2026-10-02" }),
      })
    ).toMatch(/^You're paid every other Friday, counting from Oct 2, 2026\./);
  });

  it("falls back to a generic sentence before an anchor date is picked", () => {
    expect(
      describePaySchedule({ regular_pay: true, pay_schedule: schedule({ type: "biweekly" }) })
    ).toMatch(/^You're paid every two weeks\./);
  });

  it("describes irregular income", () => {
    expect(describePaySchedule({ regular_pay: false, pay_schedule: schedule() })).toBe(
      "Your income doesn't arrive on fixed paydays. You'll budget month by month, or each time money comes in."
    );
  });
});

describe("toOnboardingPayload", () => {
  const base: OnboardingValues = {
    preset: "ph",
    currency: "PHP",
    timezone: "Asia/Manila",
    regular_pay: true,
    pay_schedule: schedule(),
  };

  it("sends paydays for a day-of-month schedule and drops the anchor", () => {
    expect(toOnboardingPayload(base)).toEqual({
      preset: "ph",
      currency: "PHP",
      timezone: "Asia/Manila",
      pay_schedule: {
        type: "semi_monthly",
        weekend_rule: "previous_business_day",
        pay_days: [15, 31],
      },
    });
  });

  it("sends only the first payday for a monthly schedule", () => {
    const payload = toOnboardingPayload({
      ...base,
      pay_schedule: schedule({ type: "monthly", pay_days: [31, 15] }),
    });

    expect(payload.pay_schedule).toEqual({
      type: "monthly",
      weekend_rule: "previous_business_day",
      pay_days: [31],
    });
  });

  it("sends the anchor date, not paydays, for weekly and biweekly", () => {
    const payload = toOnboardingPayload({
      ...base,
      pay_schedule: schedule({ type: "biweekly", anchor_date: "2026-10-02" }),
    });

    expect(payload.pay_schedule).toEqual({
      type: "biweekly",
      weekend_rule: "previous_business_day",
      anchor_date: "2026-10-02",
    });
  });

  it("sends a null schedule for irregular income", () => {
    expect(toOnboardingPayload({ ...base, regular_pay: false }).pay_schedule).toBeNull();
  });
});
