/** The formats SettingsController accepts, with a live example of each (display only). */
export const DATE_FORMATS = [
  "MMM d, yyyy",
  "d MMM yyyy",
  "MM/dd/yyyy",
  "dd/MM/yyyy",
  "yyyy-MM-dd",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function formatExample(pattern: string, locale: string, date = new Date()) {
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);

  return pattern.replace(/yyyy|MMM|MM|dd|d/g, (token) => {
    switch (token) {
      case "yyyy":
        return String(date.getFullYear());
      case "MMM":
        return month;
      case "MM":
        return pad(date.getMonth() + 1);
      case "dd":
        return pad(date.getDate());
      default:
        return String(date.getDate());
    }
  });
}
