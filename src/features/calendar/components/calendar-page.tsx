"use client";

import * as React from "react";
import { parseAsString, useQueryState } from "nuqs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import Error from "@/components/Error";

import { MONTH_PATTERN } from "../constant";
import { formatMonth, monthOf, shiftMonth, todayIn } from "../dates";
import { useCalendarMonth } from "../hooks";
import type { CalendarDay } from "../schema";
import { Agenda } from "./agenda";
import { DayDetailsSheet } from "./day-details";
import { hasActivity } from "./day-summary";
import { MonthGrid, MonthGridSkeleton } from "./month-grid";

export default function CalendarPage() {
  const { timezone } = useUserSettings();
  const today = todayIn(timezone);
  const [monthParam, setMonthParam] = useQueryState("month", parseAsString);
  const month = monthParam && MONTH_PATTERN.test(monthParam) ? monthParam : monthOf(today);
  const [openDate, setOpenDate] = React.useState<string | null>(null);

  const { data, isPending, isError, error, isPlaceholderData } = useCalendarMonth(month);

  const days = React.useMemo(
    () => new Map((data?.month === month ? data.days : []).map((day) => [day.date, day])),
    [data, month]
  );
  const openDay = openDate ? (days.get(openDate) ?? null) : null;

  const goTo = (next: string) => {
    setOpenDate(null);
    void setMonthParam(next === monthOf(today) ? null : next);
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Calendar"
        sprite="calendar"
        description="Paydays, bills due and what you spent, day by day."
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-11"
              aria-label="Previous month"
              onClick={() => goTo(shiftMonth(month, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={month === monthOf(today)}
              onClick={() => goTo(monthOf(today))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-11"
              aria-label="Next month"
              onClick={() => goTo(shiftMonth(month, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <h2 className="text-2xl" aria-live="polite">
        {formatMonth(month)}
        {isPlaceholderData && <span className="sr-only"> (loading)</span>}
      </h2>

      {isError ? (
        <Error message={error.message} />
      ) : isPending ? (
        <>
          <Skeleton className="h-16 w-full" />
          <div className="hidden md:block">
            <MonthGridSkeleton />
          </div>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </>
      ) : (
        <CalendarBody
          month={month}
          days={days}
          today={today}
          onOpenDay={setOpenDate}
          dimmed={isPlaceholderData}
        />
      )}

      <DayDetailsSheet day={openDay} onClose={() => setOpenDate(null)} />
    </div>
  );
}

function CalendarBody({
  month,
  days,
  today,
  onOpenDay,
  dimmed,
}: {
  month: string;
  days: Map<string, CalendarDay>;
  today: string;
  onOpenDay: (date: string) => void;
  dimmed: boolean;
}) {
  const list = [...days.values()];
  const paydays = list.reduce((n, day) => n + day.paydays.length, 0);
  const bills = list.flatMap((day) => day.bills);
  const due = bills.filter((bill) => bill.status === "upcoming").length;
  const overdue = bills.filter((bill) => bill.status === "overdue").length;
  const paid = bills.filter((bill) => bill.status === "paid").length;
  const isEmpty = !list.some(hasActivity);

  return (
    <div className={dimmed ? "opacity-60 transition-opacity" : undefined}>
      <dl className="pixel-panel mb-6 grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <SummaryItem sprite="coin" label="Paydays" value={paydays} />
        <SummaryItem sprite="house" label="Bills due" value={due} />
        <SummaryItem sprite="alert" label="Overdue" value={overdue} />
        <SummaryItem sprite="check" label="Bills paid" value={paid} />
      </dl>

      {isEmpty ? (
        <EmptyState
          sprite="calendar"
          title="Nothing scheduled this month"
          description="Add a bill or record income to see it here."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <MonthGrid month={month} days={days} today={today} onOpenDay={onOpenDay} />
          </div>
          <div className="md:hidden">
            <Agenda month={month} days={days} today={today} onOpenDay={onOpenDay} />
          </div>
        </>
      )}

      <Legend />
    </div>
  );
}

function SummaryItem({
  sprite,
  label,
  value,
}: {
  sprite: SpriteName;
  label: string;
  value: number;
}) {
  return (
    // A <dl> group may hold only <dt>/<dd>, so the icon sits inside the term.
    <div>
      <dt className="font-pixel text-muted-foreground flex items-center gap-2 text-sm">
        <Sprite name={sprite} size={16} />
        {label}
      </dt>
      <dd className="font-pixel pl-7 text-2xl tabular-nums">{value}</dd>
    </div>
  );
}

function Legend() {
  return (
    <div
      className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs"
      aria-label="Legend"
    >
      <span className="text-primary inline-flex items-center gap-1">
        <Sprite name="coin" size={12} /> Payday: a new cutoff starts
      </span>
      <span>
        <span className="text-income">+ amount</span> income recorded that day
      </span>
      <span>
        <span className="text-expense">− amount</span> spent that day
      </span>
      <span>Bills show Due, Overdue, Paid or Skipped</span>
    </div>
  );
}
