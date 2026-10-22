"use client";

import * as React from "react";

import Error from "@/components/Error";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

import { monthRange } from "../dates";
import { useCurrentPeriod, usePayPeriods } from "../hooks";
import { BudgetPlanner } from "./budget-planner";
import { CreateBudgetPanel } from "./create-budget-panel";
import { CutoffList } from "./cutoff-list";

/** The app's home for money: this payday's budget, or the way to start one, plus nearby cutoffs. */
export function PaydayPlanner() {
  const current = useCurrentPeriod();
  const range = React.useMemo(() => monthRange(-3, 2), []);
  const periods = usePayPeriods(range.from, range.to);

  if (current.error) return <Error message={current.error.message} />;

  const period = current.data;
  const list = periods.data ?? [];
  const index = period ? list.findIndex((p) => p.id === period.id) : -1;
  const previousBudgetId = index > 0 ? list[index - 1].budget?.id : undefined;

  return (
    // grid-cols-1 (minmax(0,1fr)) so a wide row can never stretch the column past a phone screen.
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        {!period ? (
          <Skeleton className="h-64" />
        ) : period.budget ? (
          <BudgetPlanner budgetId={period.budget.id} title="This payday" />
        ) : (
          <div className="space-y-6">
            <PageHeader title="This payday" description={period.label} />
            <CreateBudgetPanel period={period} previousBudgetId={previousBudgetId} stay />
          </div>
        )}
      </div>
      <CutoffList
        periods={periods.data}
        currentPeriodId={period?.id}
        isLoading={periods.isLoading}
      />
    </div>
  );
}
