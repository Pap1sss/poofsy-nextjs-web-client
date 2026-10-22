"use client";

import { MoneyDisplay } from "@/components/shared/money-display";
import { isZero, type Money } from "@/lib/money";
import { cn } from "@/lib/utils/component";

type BudgetProgressProps = {
  spent: Money;
  /** Allocation plus rollover, as the API reports it. */
  budget: Money;
  remaining: Money;
  /** API-computed percentage; null when nothing was allocated (plan §4: no division by zero). */
  utilization: number | null;
  /** API-computed status; the frontend never decides thresholds itself. */
  status: "ok" | "approaching" | "over";
  /** What the bar measures, for screen readers, e.g. the category name. */
  label: string;
  className?: string;
};

// HP-bar fills: plenty, getting low, over. The words beside the bar carry the meaning too.
const BAR = { ok: "bg-hp-ok", approaching: "bg-hp-mid", over: "bg-hp-low" } as const;

// Notches every few pixels, like a handheld status bar.
const NOTCHES = "repeating-linear-gradient(90deg, transparent 0 10px, rgb(0 0 0 / 0.2) 10px 12px)";

/** Spent vs budgeted for one category, as an RPG status bar. Colour is backed by words, so it never carries meaning alone. */
export function BudgetProgress({
  spent,
  budget,
  remaining,
  utilization,
  status,
  label,
  className,
}: BudgetProgressProps) {
  const unbudgeted = utilization === null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
        <span>
          <MoneyDisplay value={spent} className="font-medium" />
          <span className="text-muted-foreground">
            {" "}
            of {unbudgeted ? "no allocation" : <MoneyDisplay value={budget} tone="neutral" />}
          </span>
        </span>
        <span
          className={cn(
            "text-xs",
            status === "over"
              ? "text-expense"
              : status === "approaching"
                ? "text-warning"
                : "text-muted-foreground"
          )}
        >
          {unbudgeted ? (
            isZero(spent) ? (
              "No allocation"
            ) : (
              "Unbudgeted spending"
            )
          ) : status === "over" ? (
            <>
              <MoneyDisplay
                value={{ ...remaining, amount: remaining.amount.replace(/^-/, "") }}
                tone="neutral"
              />{" "}
              over
            </>
          ) : (
            <>
              <MoneyDisplay value={remaining} tone="neutral" /> left
            </>
          )}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} budget used`}
        aria-valuemin={0}
        aria-valuemax={100}
        // Overspending can pass 100%; the value stays in range and the text says the real figure.
        aria-valuenow={unbudgeted ? undefined : Math.min(100, Math.round(utilization))}
        aria-valuetext={unbudgeted ? "No allocation" : `${Math.round(utilization)}% used`}
        className="hp-track h-4 overflow-hidden"
      >
        <div
          className={cn(
            "h-full transition-[width] duration-300 ease-[steps(6)] motion-reduce:transition-none",
            BAR[status]
          )}
          style={{
            width: `${unbudgeted ? 0 : Math.min(utilization, 100)}%`,
            backgroundImage: NOTCHES,
          }}
        />
      </div>
    </div>
  );
}
