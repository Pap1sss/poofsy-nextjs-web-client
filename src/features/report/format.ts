import type { DateRangePreset } from "@/components/shared/date-range-picker";
import type { Money } from "@/lib/money";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Today's year and month in the user's own time zone. */
function todayIn(timeZone: string) {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-")
    .map(Number);
  return { y, m };
}

/** Whole months back from the current one: "last 6 months" = this month and the five before it. */
function monthsBack(timeZone: string, count: number) {
  const { y, m } = todayIn(timeZone);
  const start = new Date(Date.UTC(y, m - count, 1));
  return {
    from: iso(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    to: iso(y, m, lastDay(y, m)),
  };
}

export function reportPresets(timeZone: string): DateRangePreset[] {
  const { y } = todayIn(timeZone);

  return [
    { label: "Last 3 months", ...monthsBack(timeZone, 3) },
    { label: "Last 6 months", ...monthsBack(timeZone, 6) },
    { label: "This year", from: iso(y, 1, 1), to: iso(y, 12, 31) },
    { label: "Last year", from: iso(y - 1, 1, 1), to: iso(y - 1, 12, 31) },
  ];
}

/** "2026-10" -> "Oct" (axis) or "October 2026" (tooltip, table). */
export const monthLabel = (month: string, locale: string, long = false) =>
  new Intl.DateTimeFormat(locale, {
    month: long ? "long" : "short",
    ...(long ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));

export const dateLabel = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );

/** Chart geometry only. Displayed money always goes through MoneyDisplay / formatMoney. */
export const geometry = (money: Money) => Number(money.amount);

export const isZeroAmount = (money: Money) => !/[1-9]/.test(money.amount);

const ordinals: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
export const cutoffLabel = (sequence: number) => `${ordinals[sequence] ?? `${sequence}th`} cutoff`;
