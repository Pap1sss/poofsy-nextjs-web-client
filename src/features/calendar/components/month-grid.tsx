"use client";

import * as React from "react";
import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { cn } from "@/lib/utils/component";

import { MAX_BILLS_PER_CELL, WEEKDAYS } from "../constant";
import { addDays, monthGrid, monthOf } from "../dates";
import type { CalendarDay } from "../schema";
import { BillStatusLabel } from "./bill-status";
import { describeDay } from "./day-summary";
import { DayTotals } from "./day-totals";

type MonthGridProps = {
  month: string;
  days: Map<string, CalendarDay>;
  today: string;
  onOpenDay: (date: string) => void;
};

const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/** Monday-first month grid. One cell is tabbable at a time; arrow keys move between days of the month. */
export function MonthGrid({ month, days, today, onOpenDay }: MonthGridProps) {
  const weeks = React.useMemo(() => monthGrid(month), [month]);
  const [focused, setFocused] = React.useState(() =>
    monthOf(today) === month ? today : `${month}-01`
  );
  const cells = React.useRef(new Map<string, HTMLButtonElement>());

  React.useEffect(() => {
    setFocused(monthOf(today) === month ? today : `${month}-01`);
  }, [month, today]);

  const onKeyDown = (event: React.KeyboardEvent, date: string) => {
    const step = KEY_STEPS[event.key];
    if (step === undefined) return;

    event.preventDefault();
    const next = addDays(date, step);
    if (monthOf(next) !== month) return;

    setFocused(next);
    cells.current.get(next)?.focus();
  };

  return (
    <div role="grid" aria-label="Month view" className="pixel-panel overflow-hidden p-1.5">
      <div
        role="row"
        className="bg-secondary text-secondary-foreground border-outline grid grid-cols-7 border-2"
      >
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} role="columnheader" className="font-pixel px-2 py-1.5 text-sm">
            {weekday}
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={week[0].date} role="row" className="mt-1.5 grid grid-cols-7 gap-1.5">
          {week.map(({ date, inMonth }) => {
            const day = days.get(date);
            const dayNumber = Number(date.slice(8));

            if (!inMonth || !day) {
              return (
                <div
                  key={date}
                  role="gridcell"
                  aria-hidden
                  className="font-pixel text-muted-foreground bg-muted/40 border-border min-h-24 border-2 border-dashed p-2 text-sm"
                >
                  {dayNumber}
                </div>
              );
            }

            const isToday = date === today;
            const extraBills = day.bills.length - MAX_BILLS_PER_CELL;

            return (
              <div key={date} role="gridcell" className="min-w-0">
                <button
                  type="button"
                  ref={(el) => {
                    if (el) cells.current.set(date, el);
                    else cells.current.delete(date);
                  }}
                  tabIndex={date === focused ? 0 : -1}
                  onFocus={() => setFocused(date)}
                  onKeyDown={(event) => onKeyDown(event, date)}
                  onClick={() => onOpenDay(date)}
                  aria-label={describeDay(day)}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "border-outline bg-card hover:bg-accent focus-visible:outline-highlight flex size-full min-h-24 cursor-pointer flex-col gap-1 border-2 p-1.5 text-left outline-none focus-visible:outline-3 focus-visible:outline-offset-1",
                    isToday &&
                      "outline-highlight shadow-[inset_0_0_0_2px_var(--highlight)] outline-3"
                  )}
                >
                  <span
                    className={cn(
                      "font-pixel text-sm tabular-nums",
                      isToday &&
                        "bg-highlight text-highlight-foreground border-outline -ml-0.5 self-start border-2 px-1"
                    )}
                  >
                    {dayNumber}
                  </span>

                  {day.paydays.length > 0 && (
                    <span className="font-pixel text-primary inline-flex items-center gap-1 text-xs">
                      <Sprite name="coin" size={12} />
                      Payday
                    </span>
                  )}

                  {day.bills.slice(0, MAX_BILLS_PER_CELL).map((bill) => (
                    <span
                      key={bill.id}
                      className="bg-muted border-outline flex w-full flex-col border-2 px-1 py-0.5 text-xs leading-tight"
                    >
                      <span className="font-pixel truncate">{bill.bill?.name ?? "Bill"}</span>
                      <span className="flex flex-wrap items-center justify-between gap-x-1">
                        <MoneyDisplay value={bill.amount} tone="neutral" />
                        <BillStatusLabel status={bill.status} />
                      </span>
                    </span>
                  ))}
                  {extraBills > 0 && (
                    <span className="font-pixel text-muted-foreground text-xs">
                      +{extraBills} more
                    </span>
                  )}

                  <DayTotals day={day} className="mt-auto" />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function MonthGridSkeleton() {
  return (
    <div aria-hidden className="pixel-panel overflow-hidden p-1.5">
      <div className="bg-secondary border-outline h-9 border-2" />
      {Array.from({ length: 5 }, (_, week) => (
        <div key={week} className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="border-outline bg-card min-h-24 border-2 p-2">
              <div className="bg-muted h-4 w-5 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
