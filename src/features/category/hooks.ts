"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiConflictError } from "@/lib/utils/request";

import { categoryApi, type ListStatus } from "./api";
import { categoryQueryKey } from "./constant";
import type { Category, CategoryFormValues } from "./schema";

export const useCategories = (status: ListStatus = "active") =>
  useQuery({
    queryKey: [categoryQueryKey, status],
    queryFn: () => categoryApi.list(status),
    select: (res) => res.data,
  });

const useCategoryMutation = <TVars>(fn: (vars: TVars) => Promise<{ message: string }>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [categoryQueryKey] }),
  });
};

type SaveVars = { id?: string; values: CategoryFormValues; version?: string | null };

/** Create, or edit with the version the form loaded; a conflict refreshes the list so the latest shows. */
export const useSaveCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values, version }: SaveVars) =>
      id ? categoryApi.update(id, values, version) : categoryApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [categoryQueryKey] }),
    onError: (error) => {
      if (error instanceof ApiConflictError) {
        queryClient.invalidateQueries({ queryKey: [categoryQueryKey] });
      }
    },
  });
};

export const useDeleteCategory = () => useCategoryMutation((id: string) => categoryApi.remove(id));
export const useArchiveCategory = () =>
  useCategoryMutation((id: string) => categoryApi.archive(id));
export const useRestoreCategory = () =>
  useCategoryMutation((id: string) => categoryApi.restore(id));
export const useRestoreDefaultCategories = () =>
  useCategoryMutation(() => categoryApi.restoreDefaults());

export const useMergeCategory = () =>
  useCategoryMutation(({ id, targetId }: { id: string; targetId: string }) =>
    categoryApi.merge(id, targetId)
  );

/** Shows the new order immediately, then saves it; on failure the list reloads from the API. */
export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  const key = [categoryQueryKey, "active"];

  return useMutation({
    mutationFn: (ordered: Category[]) => categoryApi.reorder(ordered.map((c) => c.id)),
    onMutate: (ordered) => {
      queryClient.setQueryData(key, (old: { data: Category[] } | undefined) =>
        old ? { ...old, data: ordered } : old
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [categoryQueryKey] }),
  });
};
