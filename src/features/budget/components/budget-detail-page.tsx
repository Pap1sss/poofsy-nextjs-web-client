"use client";

import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";

import { useBudget } from "../hooks";
import { BudgetPlanner } from "./budget-planner";

export function BudgetDetailPage({ budgetId }: { budgetId: string }) {
  const { data } = useBudget(budgetId);
  useSetBreadcrumbTitle(data?.pay_period.label);

  return <BudgetPlanner budgetId={budgetId} />;
}
