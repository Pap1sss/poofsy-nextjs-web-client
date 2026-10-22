import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountOptionsResSchema,
  budgetSummaryResSchema,
  categoryOptionsResSchema,
  payPeriodResSchema,
  payPeriodsResSchema,
  type AllocationInput,
} from "./schema";

export const getCurrentPeriod = () =>
  request({ config: { method: "GET", url: "pay-periods/current" }, schema: payPeriodResSchema });

export const getPayPeriods = (from: string, to: string) =>
  request({
    config: { method: "GET", url: "pay-periods", params: { from, to } },
    schema: payPeriodsResSchema,
  });

export const getBudget = (id: string) =>
  request({ config: { method: "GET", url: `budgets/${id}` }, schema: budgetSummaryResSchema });

export const createBudget = (data: { pay_period_id: string; budget_template_id?: string | null }) =>
  request({ config: { method: "POST", url: "budgets", data }, schema: budgetSummaryResSchema });

export const copyBudget = (id: string, payPeriodId: string) =>
  request({
    config: { method: "POST", url: `budgets/${id}/copy`, data: { pay_period_id: payPeriodId } },
    schema: budgetSummaryResSchema,
  });

export const activateBudget = (id: string) =>
  request({
    config: { method: "PUT", url: `budgets/${id}`, data: { status: "active" } },
    schema: budgetSummaryResSchema,
  });

export type BudgetAction = "complete" | "reopen" | "recalculate";

export const runBudgetAction = (id: string, action: BudgetAction) =>
  request({
    config: { method: "POST", url: `budgets/${id}/${action}` },
    schema: budgetSummaryResSchema,
  });

export const deleteBudget = (id: string) =>
  request({ config: { method: "DELETE", url: `budgets/${id}` }, schema: resSchema });

export const addAllocation = (budgetId: string, data: AllocationInput) =>
  request({
    config: { method: "POST", url: `budgets/${budgetId}/allocations`, data },
    schema: budgetSummaryResSchema,
  });

export const updateAllocation = (budgetId: string, allocationId: string, data: AllocationInput) =>
  request({
    config: { method: "PUT", url: `budgets/${budgetId}/allocations/${allocationId}`, data },
    schema: budgetSummaryResSchema,
  });

export const deleteAllocation = (budgetId: string, allocationId: string) =>
  request({
    config: { method: "DELETE", url: `budgets/${budgetId}/allocations/${allocationId}` },
    schema: budgetSummaryResSchema,
  });

export const getCategoryOptions = () =>
  request({ config: { method: "GET", url: "categories" }, schema: categoryOptionsResSchema });

export const getAccountOptions = () =>
  request({ config: { method: "GET", url: "accounts" }, schema: accountOptionsResSchema });
