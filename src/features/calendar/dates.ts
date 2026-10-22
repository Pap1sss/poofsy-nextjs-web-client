/**
 * Calendar date helpers. Everything works on "YYYY-MM-DD" / "YYYY-MM" strings in UTC so a day never
 * shifts with the browser's own time zone; "today" comes from the user's saved time zone.
 */

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Today's date in a given IANA time zone, e.g. "2026-10-21" in Asia/Manila. */
export const todayIn = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const monthOf = (date: string) => date.slice(0, 7);

export const shiftMonth = (month: string, by: number) => {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + by, 1));
  return isoDate(date).slice(0, 7);
};

export const addDays = (date: string, days: number) => {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
};

/** Monday-first weeks covering the whole month, padded with days from the months around it. */
export function monthGrid(month: string): { date: string; inMonth: boolean }[][] {
  const first = `${month}-01`;
  const mondayOffset = (utc(first).getUTCDay() + 6) % 7;
  let cursor = addDays(first, -mondayOffset);
  const weeks: { date: string; inMonth: boolean }[][] = [];

  do {
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(cursor, i);
      return { date, inMonth: monthOf(date) === month };
    });
    weeks.push(week);
    cursor = addDays(cursor, 7);
  } while (monthOf(cursor) === month);

  return weeks;
}

export const formatMonth = (month: string) =>
  new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    utc(`${month}-01`)
  );

export const formatDay = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(utc(date));
