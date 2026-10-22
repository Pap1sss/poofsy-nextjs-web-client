// Date-range helpers for querying cutoffs. They only pick which periods to ask for; no money maths.

const pad = (n: number) => String(n).padStart(2, "0");

export const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** First day of the month `offset` months from today, and last day of the month `offset` from today. */
export function monthRange(fromOffset: number, toOffset: number, today = new Date()) {
  const from = new Date(today.getFullYear(), today.getMonth() + fromOffset, 1);
  const to = new Date(today.getFullYear(), today.getMonth() + toOffset + 1, 0);

  return { from: isoDate(from), to: isoDate(to) };
}
