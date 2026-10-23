"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { paylaterApi, type PaymentScope } from "./api";
import { paylaterLookupsQueryKey, paylaterQueryKey } from "./constant";
import type {
  AccountFormValues,
  PaymentFormValues,
  PrefsFormValues,
  PurchaseDetailsValues,
  PurchaseFilters,
  ScheduleFormValues,
} from "./schema";

export const usePaylaterOverview = () =>
  useQuery({
    queryKey: [paylaterQueryKey, "overview"],
    queryFn: paylaterApi.overview,
    select: (res) => res.data,
  });

export const usePaylaterInstallments = (params: { status?: string; from?: string; to?: string }) =>
  useQuery({
    queryKey: [paylaterQueryKey, "installments", params],
    queryFn: () => paylaterApi.installments(params),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });

export const usePaylaterAccounts = (status: "active" | "archived" | "all" = "active") =>
  useQuery({
    queryKey: [paylaterQueryKey, "accounts", status],
    queryFn: () => paylaterApi.accounts(status),
    select: (res) => res.data,
  });

export const usePaylaterAccount = (id: string) =>
  useQuery({
    queryKey: [paylaterQueryKey, "account", id],
    queryFn: () => paylaterApi.account(id),
    select: (res) => res.data,
  });

export const usePurchases = (filters: Partial<PurchaseFilters>) =>
  useQuery({
    queryKey: [paylaterQueryKey, "purchases", filters],
    queryFn: () => paylaterApi.purchases(filters),
    select: (res) => res.data,
    // A filter change keeps the current list on screen until the new one arrives.
    placeholderData: keepPreviousData,
  });

export const usePurchase = (id: string) =>
  useQuery({
    queryKey: [paylaterQueryKey, "purchase", id],
    queryFn: () => paylaterApi.purchase(id),
    select: (res) => res.data,
  });

export const useCashAccounts = () =>
  useQuery({
    queryKey: [paylaterLookupsQueryKey, "accounts"],
    queryFn: paylaterApi.cashAccounts,
    select: (res) => res.data,
  });

/** Spending categories only: purchases and payments are expenses. */
export const useSpendingCategories = () =>
  useQuery({
    queryKey: [paylaterLookupsQueryKey, "categories"],
    queryFn: paylaterApi.categories,
    select: (res) => res.data.filter((c) => c.kind === "spending"),
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: [paylaterLookupsQueryKey, "payment-methods"],
    queryFn: paylaterApi.paymentMethods,
    select: (res) => res.data,
  });

export const usePreviewSchedule = () => useMutation({ mutationFn: paylaterApi.previewSchedule });

/**
 * Every PayLater change refreshes the PayLater views. Payments and down payments can be expenses, so
 * balances, transactions, budgets and the dashboard refresh too.
 */
const usePaylaterMutation = <TVars, TRes>(fn: (vars: TVars) => Promise<TRes>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      [paylaterQueryKey, "transactions", "accounts", "budgets", "dashboard"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      ),
  });
};

export const useSaveAccount = () =>
  usePaylaterMutation(({ id, values }: { id?: string; values: AccountFormValues }) =>
    paylaterApi.saveAccount(id, values)
  );
export const useArchiveAccount = () => usePaylaterMutation(paylaterApi.archiveAccount);
export const useRestoreAccount = () => usePaylaterMutation(paylaterApi.restoreAccount);
export const useDeleteAccount = () => usePaylaterMutation(paylaterApi.removeAccount);

export const useCreatePurchase = () => usePaylaterMutation(paylaterApi.createPurchase);
export const useUpdatePurchase = () =>
  usePaylaterMutation(({ id, values }: { id: string; values: PurchaseDetailsValues }) =>
    paylaterApi.updatePurchase(id, values)
  );
export const useUpdateSchedule = () =>
  usePaylaterMutation(({ id, values }: { id: string; values: ScheduleFormValues }) =>
    paylaterApi.updateSchedule(id, values)
  );
export const useCancelPurchase = () =>
  usePaylaterMutation(({ id, reason }: { id: string; reason: string }) =>
    paylaterApi.cancelPurchase(id, reason)
  );
export const useReopenPurchase = () => usePaylaterMutation(paylaterApi.reopenPurchase);
export const useDeletePurchase = () => usePaylaterMutation(paylaterApi.removePurchase);

export const usePay = () =>
  usePaylaterMutation(
    ({
      accountId,
      scope,
      values,
      idempotencyKey,
    }: {
      accountId: string;
      scope: PaymentScope;
      values: PaymentFormValues;
      idempotencyKey: string;
    }) => paylaterApi.pay(accountId, scope, values, idempotencyKey)
  );
export const useCorrectPayment = () =>
  usePaylaterMutation(({ id, values }: { id: string; values: PaymentFormValues }) =>
    paylaterApi.correctPayment(id, values)
  );
export const useVoidPayment = () =>
  usePaylaterMutation(({ id, reason }: { id: string; reason: string }) =>
    paylaterApi.voidPayment(id, reason)
  );

export const useUpdatePrefs = () =>
  usePaylaterMutation((values: PrefsFormValues) => paylaterApi.updatePrefs(values));
