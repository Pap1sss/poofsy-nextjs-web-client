"use client";

import { MoneyDisplay } from "@/components/shared/money-display";
import { isZero } from "@/lib/money";
import { cn } from "@/lib/utils/component";

import type { CalendarDay } from "../schema";

/** The day's income and spending as the API reports them; zero lines are left out. */
export function DayTotals({ day, className }: { day: CalendarDay; className?: string }) {
  const income = !isZero(day.income);
  const spent = !isZero(day.spent);

  if (!income && !spent) return null;

  return (
    <div className={cn("flex flex-col text-xs leading-tight", className)}>
      {income && (
        <span>
          <span className="sr-only">Income </span>
          <MoneyDisplay value={day.income} tone="income" signed />
        </span>
      )}
      {spent && (
        <span className="text-expense">
          <span className="sr-only">Spent </span>
          <span aria-hidden>−</span>
          <MoneyDisplay value={day.spent} tone="expense" />
        </span>
      )}
    </div>
  );
}
