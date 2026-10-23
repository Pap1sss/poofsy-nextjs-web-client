"use client";

import { AlertTriangle, CircleAlert } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";

import { MoneyDisplay } from "@/components/shared/money-display";

import type { BudgetWarning } from "../schema";

/**
 * The API's warnings, said plainly, in a dialogue box headed by the alert sprite.
 * Each line has an icon and words, so colour never stands alone.
 */
export function WarningsPanel({ warnings }: { warnings: BudgetWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <section aria-labelledby="budget-warnings" className="pixel-panel p-5 md:p-6">
      <div className="flex items-center gap-3">
        <Sprite name="alert" size={24} />
        <div>
          <p className="font-pixel text-warning text-sm" aria-hidden>
            Heads up!
          </p>
          <h2 id="budget-warnings" className="text-lg leading-tight">
            Needs your attention
          </h2>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {warnings.map((warning, index) => (
          <li key={`${warning.type}-${index}`} className="flex gap-3 text-sm">
            {warning.type === "approaching_limit" ? (
              <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <CircleAlert className="text-expense mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <WarningText warning={warning} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function WarningText({ warning }: { warning: BudgetWarning }) {
  switch (warning.type) {
    case "over_allocated_expected":
    case "over_allocated_actual":
      return (
        <div className="min-w-0">
          <p>
            You&apos;ve planned{" "}
            <MoneyDisplay value={warning.amount_over} tone="expense" className="font-medium" /> more
            than you{" "}
            {warning.type === "over_allocated_actual" ? "actually received" : "expect to earn"}.
          </p>
          {warning.categories.length > 0 && (
            <p className="text-muted-foreground mt-1">
              Largest amounts:{" "}
              {warning.categories.slice(0, 4).map((c, i) => (
                <span key={c.category}>
                  {i > 0 && ", "}
                  {c.category} <MoneyDisplay value={c.amount} tone="neutral" />
                </span>
              ))}
              .
            </p>
          )}
        </div>
      );
    case "category_overspent":
      return (
        <p>
          {warning.category} is{" "}
          <MoneyDisplay value={warning.amount_over} tone="expense" className="font-medium" /> over
          budget.
        </p>
      );
    case "approaching_limit":
      return (
        <p>
          {warning.category} has used {Math.round(warning.utilization)}% of its budget.
        </p>
      );
    case "paylater_heavy":
      return (
        <p>
          <MoneyDisplay value={warning.amount} tone="expense" className="font-medium" /> of PayLater
          is due this cutoff, more than your {warning.percent}% limit (
          <MoneyDisplay value={warning.limit} tone="neutral" />
          ).
        </p>
      );
  }
}
