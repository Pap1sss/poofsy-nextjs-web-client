"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountApi, type ListStatus } from "./api";
import { accountQueryKey } from "./constant";
import type { AccountFormValues } from "./schema";

export const useAccounts = (status: ListStatus = "active") =>
  useQuery({
    queryKey: [accountQueryKey, status],
    queryFn: () => accountApi.list(status),
    select: (res) => res.data,
  });

// Both keys start with accountQueryKey, so account mutations and new transactions refresh them too.
export const useAccount = (id: string) =>
  useQuery({
    queryKey: [accountQueryKey, "detail", id],
    queryFn: () => accountApi.get(id),
    select: (res) => res.data,
  });

export const useBalanceHistory = (id: string, from: string, to: string) =>
  useQuery({
    queryKey: [accountQueryKey, "balance-history", id, from, to],
    queryFn: () => accountApi.balanceHistory(id, from, to),
    select: (res) => res.data,
  });

/** Every account mutation refreshes all account lists (active and archived). */
const useAccountMutation = <TVars, TRes extends { message: string }>(
  fn: (vars: TVars) => Promise<TRes>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [accountQueryKey] }),
  });
};

export const useSaveAccount = () =>
  useAccountMutation(({ id, values }: { id?: string; values: AccountFormValues }) =>
    id ? accountApi.update(id, values) : accountApi.create(values)
  );

export const useDeleteAccount = () => useAccountMutation((id: string) => accountApi.remove(id));
export const useArchiveAccount = () => useAccountMutation((id: string) => accountApi.archive(id));
export const useRestoreAccount = () => useAccountMutation((id: string) => accountApi.restore(id));

export const useReconcileAccount = () =>
  useAccountMutation(({ id, balance, notes }: { id: string; balance: string; notes: string }) =>
    accountApi.reconcile(id, balance, notes)
  );
