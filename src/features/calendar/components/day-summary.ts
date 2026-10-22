import { isZero } from "@/lib/money";

import type { CalendarDay } from "../schema";
import { BILL_STATUS } from "./bill-status";
import { formatDay } from "../dates";

export const hasActivity = (day: CalendarDay) =>
  day.paydays.length > 0 || day.bills.length > 0 || day.transactions_count > 0;

export const hasMoney = (day: CalendarDay) => !isZero(day.income) || !isZero(day.spent);

/** A spoken summary for the day cell's aria-label, so screen readers get what the cell shows. */
export function describeDay(day: CalendarDay) {
  const parts = [formatDay(day.date, { weekday: "long", month: "long", day: "numeric" })];

  if (day.paydays.length) parts.push("payday");
  for (const bill of day.bills) {
    parts.push(`${bill.bill?.name ?? "Bill"}, ${BILL_STATUS[bill.status].label.toLowerCase()}`);
  }
  if (day.transactions_count) {
    parts.push(`${day.transactions_count} transaction${day.transactions_count === 1 ? "" : "s"}`);
  }

  return parts.join("; ");
}
