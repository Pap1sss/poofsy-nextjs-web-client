"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { billApi, type BillStatus, type OccurrenceFilter } from "./api";
import { billLookupsQueryKey, billQueryKey, occurrenceQueryKey } from "./constant";
import type { BillFormValues, PayFormValues } from "./schema";

export const useBills = (status: BillStatus) =>
  useQuery({
    queryKey: [billQueryKey, status],
    queryFn: () => billApi.list(status),
    select: (res) => res.data,
  });

export const useOccurrences = (status: OccurrenceFilter) =>
  useQuery({
    queryKey: [occurrenceQueryKey, status],
    queryFn: () => billApi.occurrences(status),
    select: (res) => res.data,
  });

export const useBillAccounts = () =>
  useQuery({
    queryKey: [billLookupsQueryKey, "accounts"],
    queryFn: billApi.accounts,
    select: (res) => res.data,
  });

/** Bills are expenses, so only spending categories. */
export const useSpendingCategories = () =>
  useQuery({
    queryKey: [billLookupsQueryKey, "categories"],
    queryFn: billApi.categories,
    select: (res) => res.data.filter((c) => c.kind === "spending"),
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: [billLookupsQueryKey, "payment-methods"],
    queryFn: billApi.paymentMethods,
    select: (res) => res.data,
  });

/**
 * Every bill change refreshes bills, their occurrences and the dashboard. Paying also books an
 * expense, so balances, transactions and budgets refresh too.
 */
const useBillMutation = <TVars, TRes extends { message: string }>(
  fn: (vars: TVars) => Promise<TRes>,
  movesMoney = false
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      const keys = [billQueryKey, occurrenceQueryKey, "dashboard", "calendar"];
      if (movesMoney) keys.push("transactions", "accounts", "budgets");
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });
};

export const useSaveBill = () =>
  useBillMutation(({ id, values }: { id?: string; values: BillFormValues }) =>
    id ? billApi.update(id, values) : billApi.create(values)
  );

export const useSetBillActive = () =>
  useBillMutation(({ id, active }: { id: string; active: boolean }) =>
    billApi.setActive(id, active)
  );

export const useDeleteBill = () => useBillMutation((id: string) => billApi.remove(id));

export const usePayBill = () =>
  useBillMutation(
    ({
      billId,
      occurrenceId,
      values,
      idempotencyKey,
    }: {
      billId: string;
      occurrenceId: string;
      values: PayFormValues;
      idempotencyKey: string;
    }) => billApi.pay(billId, occurrenceId, values, idempotencyKey),
    true
  );

export const useSkipOccurrence = () => useBillMutation((id: string) => billApi.skip(id));
export const useUnskipOccurrence = () => useBillMutation((id: string) => billApi.unskip(id));
