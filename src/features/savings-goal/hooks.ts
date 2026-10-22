"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savingsGoalApi, type GoalStatus } from "./api";
import { savingsGoalLookupsQueryKey, savingsGoalQueryKey } from "./constant";
import type { ContributionFormValues, GoalFormValues } from "./schema";

export const useSavingsGoals = (status: GoalStatus) =>
  useQuery({
    queryKey: [savingsGoalQueryKey, status],
    queryFn: () => savingsGoalApi.list(status),
    select: (res) => res.data,
  });

export const useGoalAccounts = () =>
  useQuery({
    queryKey: [savingsGoalLookupsQueryKey, "accounts"],
    queryFn: savingsGoalApi.accounts,
    select: (res) => res.data,
  });

/** Savings and investment categories, the only kinds a transfer can be tagged with. */
export const useSavingCategories = () =>
  useQuery({
    queryKey: [savingsGoalLookupsQueryKey, "categories"],
    queryFn: savingsGoalApi.categories,
    select: (res) => res.data.filter((c) => c.kind !== "spending"),
  });

/**
 * Goal changes refresh the goal lists and the dashboard. When money moves (a contribution with a
 * transfer), balances, transactions and budgets change too.
 */
const useGoalMutation = <TVars, TRes extends { message: string }>(
  fn: (vars: TVars) => Promise<TRes>,
  movesMoney = false
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      const keys = [savingsGoalQueryKey, "dashboard"];
      if (movesMoney) keys.push("transactions", "accounts", "budgets");
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });
};

export const useSaveGoal = () =>
  useGoalMutation(({ id, values }: { id?: string; values: GoalFormValues }) =>
    id ? savingsGoalApi.update(id, values) : savingsGoalApi.create(values)
  );

export const useDeleteGoal = () => useGoalMutation((id: string) => savingsGoalApi.remove(id));
export const useArchiveGoal = () => useGoalMutation((id: string) => savingsGoalApi.archive(id));
export const useRestoreGoal = () => useGoalMutation((id: string) => savingsGoalApi.restore(id));

export const useContribute = () =>
  useGoalMutation(
    ({ id, values }: { id: string; values: ContributionFormValues }) =>
      savingsGoalApi.contribute(id, values),
    true
  );

export const useRemoveContribution = () =>
  useGoalMutation(({ goalId, contributionId }: { goalId: string; contributionId: string }) =>
    savingsGoalApi.removeContribution(goalId, contributionId)
  );
