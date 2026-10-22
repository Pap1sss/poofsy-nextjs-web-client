"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";
import { budgetKeys, queryKey } from "./constant";
import type { AllocationInput, BudgetSummary } from "./schema";

export const useCurrentPeriod = () =>
  useQuery({
    queryKey: budgetKeys.currentPeriod,
    queryFn: api.getCurrentPeriod,
    select: (res) => res.data,
  });

export const usePayPeriods = (from: string, to: string) =>
  useQuery({
    queryKey: budgetKeys.periods(from, to),
    queryFn: () => api.getPayPeriods(from, to),
    select: (res) => res.data,
  });

export const useBudget = (id: string | undefined) =>
  useQuery({
    queryKey: budgetKeys.detail(id ?? ""),
    queryFn: () => api.getBudget(id!),
    select: (res) => res.data,
    enabled: !!id,
  });

export const useCategoryOptions = () =>
  useQuery({
    queryKey: budgetKeys.categories,
    queryFn: api.getCategoryOptions,
    select: (res) => res.data,
    staleTime: 60_000,
  });

export const useAccountOptions = () =>
  useQuery({
    queryKey: budgetKeys.accounts,
    queryFn: api.getAccountOptions,
    select: (res) => res.data,
    staleTime: 60_000,
  });

/**
 * Every budget mutation answers with the full summary: put it straight into the cache, then refresh
 * the cutoff lists (their status badges may have changed).
 */
function useSummaryMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<{ message: string; data: BudgetSummary }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (res) => {
      queryClient.setQueryData(budgetKeys.detail(res.data.id), res);
      queryClient.invalidateQueries({
        queryKey: [queryKey],
        predicate: (query) => query.queryKey[1] !== "detail",
      });
    },
  });
}

export const useCreateBudget = () => useSummaryMutation(api.createBudget);

export const useCopyBudget = () =>
  useSummaryMutation(({ id, payPeriodId }: { id: string; payPeriodId: string }) =>
    api.copyBudget(id, payPeriodId)
  );

export const useActivateBudget = () => useSummaryMutation(api.activateBudget);

export const useBudgetAction = () =>
  useSummaryMutation(({ id, action }: { id: string; action: api.BudgetAction }) =>
    api.runBudgetAction(id, action)
  );

export const useAddAllocation = (budgetId: string) =>
  useSummaryMutation((data: AllocationInput) => api.addAllocation(budgetId, data));

export const useUpdateAllocation = (budgetId: string) =>
  useSummaryMutation(({ allocationId, data }: { allocationId: string; data: AllocationInput }) =>
    api.updateAllocation(budgetId, allocationId, data)
  );

export const useDeleteAllocation = (budgetId: string) =>
  useSummaryMutation((allocationId: string) => api.deleteAllocation(budgetId, allocationId));

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteBudget,
    onSuccess: (_res, id) => {
      queryClient.removeQueries({ queryKey: budgetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
