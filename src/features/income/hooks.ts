"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useUserSettings } from "@/features/auth";
import { todayIn } from "@/lib/utils/date";

import { incomeApi } from "./api";
import {
  AFFECTED_BY_INCOME,
  incomeLookupsQueryKey,
  incomeQueryKey,
  incomeSourcesQueryKey,
} from "./constant";
import type { IncomeRecordFormValues, IncomeSourceFormValues, PayChangeFormValues } from "./schema";

const shiftMonths = (isoDate: string, months: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
};

export const useIncomeRecords = (page: number, payPeriodId?: string) =>
  useQuery({
    queryKey: [incomeQueryKey, { page, payPeriodId }],
    queryFn: () => incomeApi.listRecords({ page, pay_period_id: payPeriodId }),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });

/** Recording income moves money, so balances, transactions and budget figures refetch too. */
const useInvalidateIncome = () => {
  const queryClient = useQueryClient();

  return () => {
    for (const key of [incomeQueryKey, incomeSourcesQueryKey, ...AFFECTED_BY_INCOME]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
};

export const useSaveIncomeRecord = () => {
  const invalidate = useInvalidateIncome();

  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: IncomeRecordFormValues }) =>
      id ? incomeApi.updateRecord(id, values) : incomeApi.createRecord(values),
    onSuccess: invalidate,
  });
};

export const useDeleteIncomeRecord = () => {
  const invalidate = useInvalidateIncome();

  return useMutation({ mutationFn: incomeApi.deleteRecord, onSuccess: invalidate });
};

export const useIncomeSources = (status: "active" | "all") =>
  useQuery({
    queryKey: [incomeSourcesQueryKey, status],
    queryFn: () => incomeApi.listSources(status),
    select: (res) => res.data,
  });

export const useSaveIncomeSource = () => {
  const invalidate = useInvalidateIncome();

  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: IncomeSourceFormValues }) =>
      id ? incomeApi.updateSource(id, values) : incomeApi.createSource(values),
    onSuccess: invalidate,
  });
};

export const useEndIncomeSource = () => {
  const invalidate = useInvalidateIncome();

  return useMutation({
    mutationFn: ({
      id,
      effectiveFrom,
      effectiveTo,
    }: {
      id: string;
      effectiveFrom: string;
      effectiveTo: string;
    }) =>
      // effective_from goes along so the API's "end after start" rule has both dates.
      incomeApi.updateSource(id, { effective_from: effectiveFrom, effective_to: effectiveTo }),
    onSuccess: invalidate,
  });
};

export const useChangePayAmount = () => {
  const invalidate = useInvalidateIncome();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PayChangeFormValues }) =>
      incomeApi.newSourceVersion(id, values),
    onSuccess: invalidate,
  });
};

export const useDeleteIncomeSource = () => {
  const invalidate = useInvalidateIncome();

  return useMutation({ mutationFn: incomeApi.deleteSource, onSuccess: invalidate });
};

export const useAccountOptions = () =>
  useQuery({
    queryKey: [incomeLookupsQueryKey, "accounts"],
    queryFn: incomeApi.accounts,
    select: (res) => res.data,
  });

export const useDeductionTypeOptions = () =>
  useQuery({
    queryKey: [incomeLookupsQueryKey, "deduction-types"],
    queryFn: incomeApi.deductionTypes,
    select: (res) => res.data,
  });

export const useActiveIncomeSources = () => useIncomeSources("active");

/** Cutoffs from about six months back to next month, newest first, for the payslip filter. */
export const useRecentPayPeriods = () => {
  const { timezone } = useUserSettings();
  const today = todayIn(timezone);
  const from = shiftMonths(today, -6);
  const to = shiftMonths(today, 1);

  return useQuery({
    queryKey: [incomeLookupsQueryKey, "pay-periods", from, to],
    queryFn: () => incomeApi.payPeriods(from, to),
    select: (res) => [...res.data].reverse(),
  });
};
