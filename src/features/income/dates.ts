/**
 * Formats an API calendar date ("2026-10-15") without letting the browser's time zone
 * move it to the day before.
 */
export function formatIsoDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = "en-PH"
) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );
}
