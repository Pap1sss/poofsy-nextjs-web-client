"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

import { payScheduleApi } from "./api";
import { isPreviewable, type PayScheduleFormValues } from "./schema";

export const payScheduleQueryKey = "pay-schedules";

// A schedule change rebuilds cutoffs and re-files transactions, so these refetch too.
const AFFECTED = ["pay-periods", "budgets", "transactions", "incomes", "income-lookups"];

export const usePaySchedules = () =>
  useQuery({
    queryKey: [payScheduleQueryKey],
    queryFn: payScheduleApi.list,
    select: (res) => res.data,
  });

/** Debounced so typing a date doesn't send a request per keystroke. */
export const usePaydayPreview = (values: PayScheduleFormValues | null) => {
  const [key] = useDebounce(values && isPreviewable(values) ? JSON.stringify(values) : null, 300);

  return useQuery({
    queryKey: [payScheduleQueryKey, "preview", key],
    queryFn: () => payScheduleApi.preview(JSON.parse(key!) as PayScheduleFormValues),
    enabled: key !== null,
    select: (res) => res.data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};

export const useChangePaySchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payScheduleApi.change,
    onSuccess: () => {
      for (const key of [payScheduleQueryKey, ...AFFECTED]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
};
