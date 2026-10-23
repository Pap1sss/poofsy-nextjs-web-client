"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import Error from "@/components/Error";
import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { CategoryBadge } from "@/components/shared/category-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";

import { CATEGORY_KINDS, type BudgetSummary } from "../schema";
import { KIND_LABEL, STATUS_LABEL } from "../constant";
import { useBudget } from "../hooks";
import { AddAllocation } from "./add-allocation";
import { AllocationRow } from "./allocation-row";
import { BudgetActions } from "./budget-actions";
import { WarningsPanel } from "./warnings-panel";

/** The cutoff budget: what came in, where it's planned to go, and what's left. Every figure is the API's. */
export function BudgetPlanner({ budgetId, title }: { budgetId: string; title?: string }) {
  const { data: budget, isLoading, error } = useBudget(budgetId);

  if (error) return <Error message={error.message} />;
  if (isLoading || !budget) return <PlannerSkeleton />;

  return <Planner budget={budget} title={title} />;
}

export function StatusBadge({ status }: { status: BudgetSummary["status"] | null }) {
  if (!status) return <Badge variant="outline">No budget</Badge>;

  return (
    <Badge
      variant={status === "active" ? "default" : status === "completed" ? "secondary" : "outline"}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

// Each kind of allocation gets its own menu box and sprite.
const KIND_SPRITE: Record<(typeof CATEGORY_KINDS)[number], SpriteName> = {
  spending: "receipt",
  savings: "piggy",
  investment: "chart",
};

function Planner({ budget, title }: { budget: BudgetSummary; title?: string }) {
  const editable = budget.status !== "completed";
  const expected = budget.income.basis === "expected";

  return (
    <div className="space-y-8">
      <PageHeader
        title={title ?? budget.pay_period.label}
        sprite={title ? "calendar" : "bag"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {title && <span>{budget.pay_period.label}</span>}
            <StatusBadge status={budget.status} />
          </span>
        }
        actions={<BudgetActions budget={budget} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          sprite="coin"
          label={expected ? "Income (expected)" : "Income received"}
          value={<MoneyDisplay value={expected ? budget.income.expected : budget.income.actual} />}
          hint={
            expected ? (
              "No income recorded for this cutoff yet"
            ) : (
              <>
                Expected <MoneyDisplay value={budget.income.expected} tone="neutral" />
              </>
            )
          }
        />
        <StatCard
          sprite="scroll"
          label="Planned"
          value={<MoneyDisplay value={budget.totals.allocated} />}
        />
        <StatCard
          sprite="wallet"
          label={expected ? "Left to plan (expected)" : "Left to plan"}
          value={<MoneyDisplay value={budget.totals.remaining_unallocated} />}
          hint="Income not yet given a job"
        />
        <StatCard
          sprite="bag"
          label="Left to spend"
          value={<MoneyDisplay value={budget.totals.remaining_spendable} />}
          hint="Income received, minus spending and savings so far"
        />
      </div>

      <WarningsPanel warnings={budget.warnings} />

      {/* Planned, not spent: it only counts as spending once it's paid. */}
      {budget.paylater.count > 0 && (
        <p className="pixel-box bg-card flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
          <Sprite name="card" size={18} />
          <span>
            <MoneyDisplay value={budget.paylater.scheduled} className="font-medium" /> of PayLater
            is due this cutoff ({budget.paylater.count}{" "}
            {budget.paylater.count === 1 ? "installment" : "installments"}). Leave room for it; it
            counts as spending once you pay it.
          </span>
          <Link
            href={routes.paylater.home}
            className="font-pixel text-primary underline decoration-2 underline-offset-4"
          >
            Open PayLater
          </Link>
        </p>
      )}

      {!editable && (
        <p className="pixel-box bg-card flex w-fit items-center gap-3 px-4 py-2 text-sm">
          <Sprite name="check" size={18} />
          Completed. Reopen this budget to make changes.
        </p>
      )}

      {budget.allocations.length === 0 && (
        <p className="pixel-box bg-card text-muted-foreground px-4 py-3 text-sm">
          Nothing planned yet. Add the categories this payday has to cover.
        </p>
      )}

      {CATEGORY_KINDS.map((kind) => {
        const rows = budget.allocations.filter((a) => a.category.kind === kind);
        if (rows.length === 0) return null;

        return (
          <section
            key={kind}
            aria-labelledby={`allocations-${kind}`}
            className="pixel-panel px-4 py-3 md:px-6"
          >
            <h2 id={`allocations-${kind}`} className="flex items-center gap-2 pt-1 text-xl">
              <Sprite name={KIND_SPRITE[kind]} size={20} />
              {KIND_LABEL[kind]}
            </h2>
            <ul className="divide-y-2 divide-dashed">
              {rows.map((allocation) => (
                <AllocationRow
                  key={allocation.id}
                  budgetId={budget.id}
                  allocation={allocation}
                  editable={editable}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {budget.unbudgeted.length > 0 && (
        <section aria-labelledby="unbudgeted" className="pixel-panel space-y-3 px-4 py-4 md:px-6">
          <div>
            <h2 id="unbudgeted" className="flex items-center gap-2 text-xl">
              <Sprite name="alert" size={18} />
              Unbudgeted spending
            </h2>
            <p className="text-muted-foreground text-sm">
              Spent in categories this budget doesn&apos;t cover. Add them to keep track.
            </p>
          </div>
          <ul className="pixel-box bg-card divide-y-2 divide-dashed">
            {budget.unbudgeted.map((row, index) => (
              <li
                key={row.category?.id ?? index}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <CategoryBadge
                  name={row.category?.name ?? "No category"}
                  color={row.category?.color}
                />
                <MoneyDisplay value={row.actual} tone="expense" className="font-medium" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="border-outline flex flex-wrap items-start gap-3 border-t-4 border-double pt-6">
        {editable && (
          <AddAllocation
            budgetId={budget.id}
            allocatedCategoryIds={budget.allocations.map((a) => a.category.id)}
          />
        )}
        <Button variant="outline" asChild>
          <Link href={routes.transactions}>
            <Plus className="size-4" aria-hidden />
            Add expense
          </Link>
        </Button>
      </div>
    </div>
  );
}

function PlannerSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading budget">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}
