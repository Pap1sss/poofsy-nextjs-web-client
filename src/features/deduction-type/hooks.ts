"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deductionTypeApi, type ListStatus } from "./api";
import { deductionTypeQueryKey } from "./constant";
import type { DeductionTypeFormValues } from "./schema";

export const useDeductionTypes = (status: ListStatus = "active") =>
  useQuery({
    queryKey: [deductionTypeQueryKey, status],
    queryFn: () => deductionTypeApi.list(status),
    select: (res) => res.data,
  });

const useDeductionTypeMutation = <TVars>(fn: (vars: TVars) => Promise<{ message: string }>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [deductionTypeQueryKey] }),
  });
};

export const useSaveDeductionType = () =>
  useDeductionTypeMutation(({ id, values }: { id?: string; values: DeductionTypeFormValues }) =>
    id ? deductionTypeApi.update(id, values) : deductionTypeApi.create(values)
  );

export const useDeleteDeductionType = () =>
  useDeductionTypeMutation((id: string) => deductionTypeApi.remove(id));
export const useArchiveDeductionType = () =>
  useDeductionTypeMutation((id: string) => deductionTypeApi.archive(id));
export const useRestoreDeductionType = () =>
  useDeductionTypeMutation((id: string) => deductionTypeApi.restore(id));
