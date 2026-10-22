import type { DateRangePreset } from "@/components/shared/date-range-picker";

/** Today as YYYY-MM-DD in the user's time zone. */
export function todayIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const monthRange = (year: number, month: number) => ({
  from: `${year}-${pad(month)}-01`,
  to: `${year}-${pad(month)}-${pad(lastDay(year, month))}`,
});

/** Calendar presets around today; "This cutoff" is added by the caller from the API's current period. */
export function calendarPresets(timeZone: string): DateRangePreset[] {
  const [year, month] = todayIn(timeZone).split("-").map(Number);
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const threeBack = new Date(Date.UTC(year, month - 3, 1));

  return [
    { label: "This month", ...monthRange(year, month) },
    { label: "Last month", ...monthRange(prev.y, prev.m) },
    {
      label: "Last 3 months",
      from: `${threeBack.getUTCFullYear()}-${pad(threeBack.getUTCMonth() + 1)}-01`,
      to: monthRange(year, month).to,
    },
    { label: "This year", from: `${year}-01-01`, to: `${year}-12-31` },
  ];
}

/** Whole days from today to an ISO date, both in the user's zone (display only). */
export function daysFromToday(isoDate: string, timeZone: string) {
  const today = Date.parse(`${todayIn(timeZone)}T00:00:00Z`);
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - today) / 86_400_000);
}

export function shortDate(isoDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
