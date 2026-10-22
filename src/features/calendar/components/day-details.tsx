"use client";

import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { routes } from "@/config/routes";
import { useMediaQuery } from "@/hooks/use-media-query";

import { formatDay } from "../dates";
import type { CalendarDay } from "../schema";
import { BillStatusLabel } from "./bill-status";
import { hasActivity, hasMoney } from "./day-summary";
import { DayTotals } from "./day-totals";

/** Everything on one day, in a side sheet on wide screens and a bottom sheet on phones. */
export function DayDetailsSheet({
  day,
  onClose,
}: {
  day: CalendarDay | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Sheet open={!!day} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={isDesktop ? "right" : "bottom"} className="max-h-[85dvh] overflow-y-auto">
        {day && (
          <>
            <SheetHeader>
              <SheetTitle>
                {formatDay(day.date, { weekday: "long", month: "long", day: "numeric" })}
              </SheetTitle>
              <SheetDescription>
                {hasActivity(day)
                  ? "Paydays, bills and money moved on this day."
                  : "Nothing on this day yet."}
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <DayDetails day={day} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function DayDetails({ day }: { day: CalendarDay }) {
  return (
    <div className="space-y-5">
      {day.paydays.length > 0 && (
        <section aria-label="Paydays" className="space-y-2">
          {day.paydays.map((payday) => (
            <Link
              key={payday.pay_period_id}
              href={routes.budgets.home}
              className="pixel-box bg-card hover:bg-accent focus-visible:outline-highlight flex min-h-11 items-center gap-3 px-3 py-2 outline-none focus-visible:outline-3"
            >
              <Sprite name="coin" size={20} />
              <span className="min-w-0">
                <span className="font-pixel block text-base">Payday</span>
                <span className="text-muted-foreground block truncate text-sm">
                  Starts the {payday.label} cutoff
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {day.bills.length > 0 && (
        <section aria-labelledby="day-bills" className="space-y-2">
          <h3 id="day-bills" className="text-base">
            Bills
          </h3>
          <ul className="space-y-2">
            {day.bills.map((bill) => (
              <li key={bill.id}>
                <Link
                  href={routes.bills}
                  className="pixel-box bg-card hover:bg-accent focus-visible:outline-highlight flex min-h-11 items-center justify-between gap-3 px-3 py-2 outline-none focus-visible:outline-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Sprite name="house" size={20} />
                    <span className="min-w-0">
                      <span className="font-pixel block truncate text-sm">
                        {bill.bill?.name ?? "Bill"}
                      </span>
                      <BillStatusLabel status={bill.status} className="text-xs" />
                    </span>
                  </span>
                  <MoneyDisplay
                    value={bill.amount}
                    tone="neutral"
                    className="text-sm font-medium"
                  />
                </Link>
              </li>
            ))}
          </ul>
          {day.bills.some((bill) => bill.status === "upcoming" || bill.status === "overdue") && (
            <p className="text-muted-foreground text-xs">Mark bills as paid on the Bills page.</p>
          )}
        </section>
      )}

      {hasMoney(day) && (
        <section aria-labelledby="day-money" className="space-y-1">
          <h3 id="day-money" className="text-base">
            Money in and out
          </h3>
          <DayTotals day={day} className="text-sm" />
        </section>
      )}

      {day.transactions_count > 0 ? (
        <Button asChild variant="outline" className="min-h-11 w-full">
          <Link href={`${routes.transactions}?from=${day.date}&to=${day.date}`}>
            <ArrowLeftRight className="size-4" aria-hidden />
            See {day.transactions_count} transaction{day.transactions_count === 1 ? "" : "s"}
          </Link>
        </Button>
      ) : (
        !hasActivity(day) && (
          <p className="text-muted-foreground text-sm">
            No paydays, bills or transactions on this day.
          </p>
        )
      )}
    </div>
  );
}
