import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

export const minutesToMilliseconds = (minutes: number) => minutes * 1000 * 60;

/**
 * The zone this browser is set to. Used whenever the user has not chosen one,
 * which is the right default: it is almost always the zone they are actually in.
 */
export const browserTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/**
 * Today's calendar date in `timeZone`, as `YYYY-MM-DD`.
 *
 * This is the whole point of the timezone setting: it answers "what is today for
 * this user?", which is what a form's default date needs. `toISOString()` cannot
 * do it — that converts to UTC first, so at UTC+8 every hour before 08:00 reports
 * yesterday.
 *
 * Built on `Intl` rather than the `TZDate` below because `@date-fns/tz` is not
 * declared in package.json and resolves only by happening to be in node_modules.
 */
export function todayIn(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Now in `timeZone`, shaped for a `datetime-local` input (`YYYY-MM-DDTHH:mm`). */
export function nowInputIn(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Render an instant — `created_at`, `updated_at` — in a given zone.
 *
 * Only for genuine timestamps. A calendar date (e.g. a due date) carries
 * no time and no zone, so converting one shifts it by a day for no reason; render
 * those with `new Date(dateStr + "T00:00:00")`, which is zone-independent.
 *
 * Defaults to the browser's zone.
 */
export const formatDateTime = (
  date: string | number | Date | null | undefined,
  formatStr: string = "MMM dd yyyy",
  timeZone: string = browserTimezone()
): string => {
  if (!date) return "";
  return format(new TZDate(new Date(date), timeZone), formatStr);
};

/**
 * "Today" or "Yesterday" for the two most recent calendar days, else `null` so
 * the caller can apply its own format.
 *
 * Both sides are compared as `YYYY-MM-DD` strings. Doing it with Date objects
 * is the trap: `new Date("2026-08-22")` parses as UTC midnight, so comparing it
 * against a local date is off by one for every negative offset. `today` is
 * passed in — from `useToday()` — rather than read here, so the answer follows
 * the user's chosen zone instead of the browser's.
 */
export function relativeDayLabel(dateStr: string, today: string): string | null {
  const date = dateStr.slice(0, 10);

  if (date === today) return "Today";

  // One day back from `today` without touching timezones: parse as local
  // midnight, step back, reformat. Handles month and year ends.
  const prev = new Date(`${today}T00:00:00`);
  prev.setDate(prev.getDate() - 1);
  const yesterday = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;

  return date === yesterday ? "Yesterday" : null;
}
