"use client";

import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn } from "@/lib/utils/component";

import { formatDay, monthGrid } from "../dates";
import type { CalendarDay } from "../schema";
import { BillStatusLabel } from "./bill-status";
import { describeDay, hasActivity } from "./day-summary";
import { DayTotals } from "./day-totals";

type AgendaProps = {
  month: string;
  days: Map<string, CalendarDay>;
  today: string;
  onOpenDay: (date: string) => void;
};

/** Phones: only the days that have something, grouped by Monday-first week, as RPG menu lists. */
export function Agenda({ month, days, today, onOpenDay }: AgendaProps) {
  const weeks = monthGrid(month)
    .map((week) =>
      week
        .filter(({ inMonth }) => inMonth)
        .map(({ date }) => days.get(date))
        .filter((day): day is CalendarDay => !!day && hasActivity(day))
    )
    .filter((week) => week.length > 0);

  return (
    <div className="space-y-5">
      {weeks.map((week) => (
        <section
          key={week[0].date}
          aria-label={`Week of ${formatDay(week[0].date, { month: "long", day: "numeric" })}`}
        >
          <h3 className="text-muted-foreground mb-2 text-sm">
            Week of {formatDay(week[0].date, { month: "short", day: "numeric" })}
          </h3>
          <ul className="pixel-panel divide-border divide-y-2 p-1">
            {week.map((day) => (
              <li key={day.date}>
                <button
                  type="button"
                  onClick={() => onOpenDay(day.date)}
                  aria-label={describeDay(day)}
                  aria-current={day.date === today ? "date" : undefined}
                  className={cn(
                    "menu-cursor hover:bg-accent focus-visible:outline-highlight flex min-h-11 w-full items-start gap-3 py-3 pr-3 pl-5 text-left outline-none focus-visible:outline-3",
                    day.date === today && "bg-accent"
                  )}
                >
                  <span className="w-12 shrink-0 text-center">
                    <span className="font-pixel text-muted-foreground block text-xs">
                      {formatDay(day.date, { weekday: "short" })}
                    </span>
                    <span
                      className={cn(
                        "font-pixel block text-lg tabular-nums",
                        day.date === today &&
                          "bg-highlight text-highlight-foreground border-outline border-2"
                      )}
                    >
                      {Number(day.date.slice(8))}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 space-y-1 text-sm">
                    {day.paydays.length > 0 && (
                      <span className="font-pixel text-primary flex items-center gap-1">
                        <Sprite name="coin" size={14} />
                        Payday
                      </span>
                    )}
                    {day.bills.map((bill) => (
                      <span key={bill.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{bill.bill?.name ?? "Bill"}</span>
                        <span className="flex shrink-0 items-center gap-2 text-xs">
                          <MoneyDisplay value={bill.amount} tone="neutral" />
                          <BillStatusLabel status={bill.status} />
                        </span>
                      </span>
                    ))}
                    <DayTotals day={day} className="flex-row gap-3" />
                    {day.transactions_count > 0 && !day.bills.length && !day.paydays.length && (
                      <span className="text-muted-foreground block text-xs">
                        {day.transactions_count} transaction
                        {day.transactions_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
