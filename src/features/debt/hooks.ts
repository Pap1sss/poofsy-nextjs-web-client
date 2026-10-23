"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { debtApi, exportDebts } from "./api";
import { debtLookupsQueryKey, debtQueryKey, peopleQueryKey } from "./constant";
import type { DebtFilters, DebtFormValues, PersonFormValues, SettlementFormValues } from "./schema";

export const useDebts = (filters: DebtFilters) =>
  useQuery({
    queryKey: [debtQueryKey, "list", filters],
    queryFn: () => debtApi.list(filters),
    select: (res) => res.data,
    // A filter change keeps the current list on screen until the new one arrives.
    placeholderData: keepPreviousData,
  });

export const useDebt = (id: string) =>
  useQuery({
    queryKey: [debtQueryKey, "detail", id],
    queryFn: () => debtApi.show(id),
    select: (res) => res.data,
  });

export const usePeople = () =>
  useQuery({
    queryKey: [peopleQueryKey, "list"],
    queryFn: debtApi.people,
    select: (res) => res.data,
  });

export const usePerson = (id: string) =>
  useQuery({
    queryKey: [peopleQueryKey, "detail", id],
    queryFn: () => debtApi.person(id),
    select: (res) => res.data,
  });

export const useDebtAccounts = () =>
  useQuery({
    queryKey: [debtLookupsQueryKey, "accounts"],
    queryFn: debtApi.accounts,
    select: (res) => res.data,
  });

/** Spending categories only: a payment recorded as an expense needs one. */
export const useSpendingCategories = () =>
  useQuery({
    queryKey: [debtLookupsQueryKey, "categories"],
    queryFn: debtApi.categories,
    select: (res) => res.data.filter((c) => c.kind === "spending"),
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: [debtLookupsQueryKey, "payment-methods"],
    queryFn: debtApi.paymentMethods,
    select: (res) => res.data,
  });

/**
 * Every debt change refreshes the debt lists and people. Money can move with it (an opening movement or a
 * payment recorded in an account), so balances, transactions, budgets and the dashboard refresh too.
 */
const useDebtMutation = <TVars, TRes>(fn: (vars: TVars) => Promise<TRes>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      [debtQueryKey, peopleQueryKey, "transactions", "accounts", "budgets", "dashboard"].forEach(
        (key) => queryClient.invalidateQueries({ queryKey: [key] })
      ),
  });
};

export const useSaveDebt = () =>
  useDebtMutation(({ id, values }: { id?: string; values: DebtFormValues }) =>
    id ? debtApi.update(id, values) : debtApi.create(values)
  );

export const useDeleteDebt = () => useDebtMutation((id: string) => debtApi.remove(id));

export const useCancelDebt = () =>
  useDebtMutation(({ id, reason }: { id: string; reason: string }) => debtApi.cancel(id, reason));

export const useReopenDebt = () => useDebtMutation((id: string) => debtApi.reopen(id));

export const useSettleDebt = () =>
  useDebtMutation(
    ({
      debtId,
      values,
      idempotencyKey,
    }: {
      debtId: string;
      values: SettlementFormValues;
      idempotencyKey: string;
    }) => debtApi.settle(debtId, values, idempotencyKey)
  );

export const useCorrectSettlement = () =>
  useDebtMutation(
    ({
      debtId,
      settlementId,
      values,
    }: {
      debtId: string;
      settlementId: string;
      values: SettlementFormValues;
    }) => debtApi.correctSettlement(debtId, settlementId, values)
  );

export const useVoidSettlement = () =>
  useDebtMutation(
    ({ debtId, settlementId, reason }: { debtId: string; settlementId: string; reason: string }) =>
      debtApi.voidSettlement(debtId, settlementId, reason)
  );

export const useUpdatePerson = () =>
  useDebtMutation(({ id, values }: { id: string; values: PersonFormValues }) =>
    debtApi.updatePerson(id, values)
  );

export const useDeletePerson = () => useDebtMutation((id: string) => debtApi.removePerson(id));

export const useExportDebts = () => useMutation({ mutationFn: exportDebts });
