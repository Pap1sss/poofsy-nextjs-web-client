"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/component";

import { DIRECTION_LABELS, STATUS_LABELS } from "../constant";
import type { Debt, DebtDirection, DebtStatus } from "../schema";

/** "2026-10-21" -> "Oct 21, 2026", read as a calendar date (no time zone shift). */
export const longDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  );

// Money coming back to me reads as income; money I owe reads as an expense. Words carry it too.
const DIRECTION_STYLE = {
  receivable: { sprite: "coin", text: "text-income" },
  payable: { sprite: "receipt", text: "text-expense" },
} as const;

export const directionTone = (direction: DebtDirection) =>
  direction === "receivable" ? ("income" as const) : ("expense" as const);

export function DirectionBadge({
  direction,
  className,
}: {
  direction: DebtDirection;
  className?: string;
}) {
  const style = DIRECTION_STYLE[direction];

  return (
    <span
      className={cn(
        "font-pixel border-outline bg-card inline-flex items-center gap-1.5 border-2 px-1.5 py-0.5 text-xs",
        style.text,
        className
      )}
    >
      <Sprite name={style.sprite} size={14} />
      {DIRECTION_LABELS[direction]}
    </span>
  );
}

const STATUS_STYLE: Record<DebtStatus, string> = {
  active: "text-foreground",
  partially_paid: "text-warning",
  overdue: "bg-expense text-background border-expense",
  settled: "text-income",
  cancelled: "text-muted-foreground line-through decoration-2",
};

export function StatusBadge({ status, className }: { status: DebtStatus; className?: string }) {
  return (
    <span
      className={cn(
        "font-pixel border-outline inline-flex items-center border-2 px-1.5 py-0.5 text-xs",
        STATUS_STYLE[status],
        className
      )}
    >
      {status === "settled" && <Sprite name="check" size={12} className="mr-1" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

// Notches every few pixels, like a handheld status bar (same look as BudgetProgress and GoalProgress).
const NOTCHES = "repeating-linear-gradient(90deg, transparent 0 10px, rgb(0 0 0 / 0.2) 10px 12px)";

/** How much of a debt is paid off, as an HP-style bar. The percentage comes from the API. */
export function DebtProgress({
  percent,
  label,
  className,
}: {
  percent: number;
  /** What the bar measures, for screen readers: "Juan: Lunch money". */
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={`${label} paid off`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${percent}% paid`}
        className="hp-track h-3 flex-1 overflow-hidden"
      >
        <div
          className="bg-hp-ok h-full transition-[width] duration-300 ease-[steps(6)] motion-reduce:transition-none"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundImage: NOTCHES }}
        />
      </div>
      <span className="font-pixel w-12 shrink-0 text-right text-xs tabular-nums">{percent}%</span>
    </div>
  );
}

/** One debt in a list: who, what, how far along, and what's left. The whole row opens the debt. */
export function DebtRow({ debt, showPerson = true }: { debt: Debt; showPerson?: boolean }) {
  const closed = debt.status === "settled" || debt.status === "cancelled";

  return (
    <li>
      <Link
        href={routes.debts.detail(debt.id)}
        className="hover:bg-accent focus-visible:outline-highlight group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-4 outline-none focus-visible:outline-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:px-5"
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <DirectionBadge direction={debt.direction} />
            <StatusBadge status={debt.status} />
          </div>
          <p className="font-pixel truncate text-base">
            {showPerson ? (
              <>
                {debt.person.name}
                <span className="text-muted-foreground font-sans text-sm">
                  {" "}
                  · {debt.description}
                </span>
              </>
            ) : (
              debt.description
            )}
          </p>
          <p className="text-muted-foreground text-xs">
            {debt.due_date ? `Due ${longDate(debt.due_date)}` : "No due date"}
            {debt.settlements_count > 0 &&
              ` · ${debt.settlements_count} ${debt.settlements_count === 1 ? "payment" : "payments"}`}
          </p>
        </div>

        <DebtProgress
          percent={debt.progress_percent}
          label={`${debt.person.name}: ${debt.description}`}
          className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
        />

        <div className="flex items-center gap-2 text-right">
          <div>
            <MoneyDisplay
              value={debt.remaining}
              tone={closed ? "neutral" : directionTone(debt.direction)}
              className={cn("font-stat block text-3xl leading-none", closed && "opacity-60")}
            />
            <span className="text-muted-foreground text-xs">
              left of <MoneyDisplay value={debt.original_amount} tone="neutral" />
            </span>
          </div>
          <ChevronRight
            className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  );
}

// Same RPG-menu list as Bills: framed panel, dashed dividers between rows.
export const ROW_LIST = "pixel-panel divide-border divide-y-2 divide-dashed px-1 py-1";
