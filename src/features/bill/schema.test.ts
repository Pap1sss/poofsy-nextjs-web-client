import { describe, expect, it } from "vitest";

import { describeRRule, parseRRule, toRRule, type RepeatValues } from "./schema";

const values = (overrides: Partial<RepeatValues>): RepeatValues => ({
  repeat: "monthly",
  weekday: "MO",
  month_day: "1",
  month: "1",
  ...overrides,
});

describe("bill repeat rules (RRULE)", () => {
  it.each<[string, Partial<RepeatValues>, string]>([
    ["weekly", { repeat: "weekly", weekday: "FR" }, "FREQ=WEEKLY;BYDAY=FR"],
    ["monthly", { repeat: "monthly", month_day: "25" }, "FREQ=MONTHLY;BYMONTHDAY=25"],
    [
      "monthly on the last day",
      { repeat: "monthly", month_day: "31" },
      "FREQ=MONTHLY;BYMONTHDAY=-1",
    ],
    [
      "every 2 months",
      { repeat: "every_2_months", month_day: "10" },
      "FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=10",
    ],
    [
      "quarterly on the last day",
      { repeat: "quarterly", month_day: "31" },
      "FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=-1",
    ],
    [
      "yearly",
      { repeat: "yearly", month: "4", month_day: "15" },
      "FREQ=YEARLY;BYMONTH=4;BYMONTHDAY=15",
    ],
  ])("builds and reads back %s", (_name, input, rule) => {
    const built = toRRule(values(input));

    expect(built).toBe(rule);
    expect(toRRule(parseRRule(built)!)).toBe(rule);
  });

  it("reads rules stored with the RRULE: prefix and an explicit INTERVAL=1", () => {
    expect(parseRRule("RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=5")).toMatchObject({
      repeat: "monthly",
      month_day: "5",
    });
  });

  it.each([
    "FREQ=DAILY",
    "FREQ=WEEKLY;BYDAY=MO,TH",
    "FREQ=MONTHLY;BYDAY=1MO",
    "FREQ=MONTHLY;INTERVAL=4;BYMONTHDAY=1",
    "FREQ=MONTHLY;BYMONTHDAY=15;COUNT=6",
    "FREQ=YEARLY;BYMONTH=13;BYMONTHDAY=1",
  ])("leaves %s to the custom fallback", (rule) => {
    expect(parseRRule(rule)).toBeNull();
    expect(describeRRule(rule)).toBe(`Custom schedule (${rule})`);
  });

  it.each([
    ["FREQ=MONTHLY;BYMONTHDAY=25", "Every month on the 25th"],
    ["FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=-1", "Every 3 months on the last day"],
    ["FREQ=WEEKLY;BYDAY=MO", "Every week on Monday"],
    ["FREQ=YEARLY;BYMONTH=4;BYMONTHDAY=15", "Every year on April 15"],
  ])("describes %s as %s", (rule, text) => {
    expect(describeRRule(rule)).toBe(text);
  });
});
