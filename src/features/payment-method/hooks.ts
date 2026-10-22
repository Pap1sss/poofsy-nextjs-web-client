"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { paymentMethodApi, type ListStatus } from "./api";
import { paymentMethodQueryKey } from "./constant";
import type { PaymentMethodFormValues } from "./schema";

export const usePaymentMethods = (status: ListStatus = "active") =>
  useQuery({
    queryKey: [paymentMethodQueryKey, status],
    queryFn: () => paymentMethodApi.list(status),
    select: (res) => res.data,
  });

const usePaymentMethodMutation = <TVars>(fn: (vars: TVars) => Promise<{ message: string }>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [paymentMethodQueryKey] }),
  });
};

export const useSavePaymentMethod = () =>
  usePaymentMethodMutation(({ id, values }: { id?: string; values: PaymentMethodFormValues }) =>
    id ? paymentMethodApi.update(id, values) : paymentMethodApi.create(values)
  );

export const useDeletePaymentMethod = () =>
  usePaymentMethodMutation((id: string) => paymentMethodApi.remove(id));
export const useArchivePaymentMethod = () =>
  usePaymentMethodMutation((id: string) => paymentMethodApi.archive(id));
export const useRestorePaymentMethod = () =>
  usePaymentMethodMutation((id: string) => paymentMethodApi.restore(id));
