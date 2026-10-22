"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTransaction,
  deleteReceipt,
  deleteTransaction,
  exportTransactions,
  fetchAccountOptions,
  fetchCategoryOptions,
  fetchPaymentMethodOptions,
  fetchReceipts,
  fetchTransactions,
  updateTransaction,
  uploadReceipt,
} from "./api";
import {
  accountsQueryKey,
  budgetsQueryKey,
  categoriesQueryKey,
  paymentMethodsQueryKey,
  transactionQueryKey,
} from "./constant";
import type { TransactionFilters, TransactionFormValues } from "./schema";

export const useTransactions = (filters: TransactionFilters) =>
  useQuery({
    queryKey: [transactionQueryKey, "list", filters],
    queryFn: () => fetchTransactions(filters),
    select: (res) => res.data,
    // Keep the current page on screen while the next one loads, so the table doesn't flash empty.
    placeholderData: keepPreviousData,
  });

export const useAccountOptions = () =>
  useQuery({
    queryKey: [accountsQueryKey, "options"],
    queryFn: fetchAccountOptions,
    select: (res) => res.data,
    staleTime: 60_000,
  });

export const useCategoryOptions = () =>
  useQuery({
    queryKey: [categoriesQueryKey, "options"],
    queryFn: fetchCategoryOptions,
    select: (res) => res.data,
    staleTime: 60_000,
  });

export const usePaymentMethodOptions = () =>
  useQuery({
    queryKey: [paymentMethodsQueryKey, "options"],
    queryFn: fetchPaymentMethodOptions,
    select: (res) => res.data,
    staleTime: 60_000,
  });

/** A write moves balances and budget actuals, so all three refresh. */
const useInvalidateLedger = () => {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(
      [transactionQueryKey, accountsQueryKey, budgetsQueryKey].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
};

export const useSaveTransaction = () => {
  const invalidate = useInvalidateLedger();

  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: TransactionFormValues }) =>
      id ? updateTransaction(id, values) : createTransaction(values),
    onSuccess: () => invalidate(),
  });
};

export const useDeleteTransaction = () => {
  const invalidate = useInvalidateLedger();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => invalidate(),
  });
};

export const useExportTransactions = () =>
  useMutation({ mutationFn: (filters: TransactionFilters) => exportTransactions(filters) });

const receiptsKey = (transactionId: string) => [transactionQueryKey, transactionId, "receipts"];

export const useReceipts = (transactionId: string | undefined) =>
  useQuery({
    queryKey: receiptsKey(transactionId ?? ""),
    queryFn: () => fetchReceipts(transactionId!),
    select: (res) => res.data,
    enabled: !!transactionId,
    // Signed URLs expire after 10 minutes; refetch before handing out a stale one.
    staleTime: 5 * 60_000,
  });

export const useUploadReceipt = (transactionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadReceipt(transactionId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [transactionQueryKey] }),
  });
};

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [transactionQueryKey] }),
  });
};
