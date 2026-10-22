"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "./api";

export const queryKey = "budget-templates";

export const useTemplates = () =>
  useQuery({ queryKey: [queryKey], queryFn: api.getTemplates, select: (res) => res.data });

export const useTemplate = (id: string) =>
  useQuery({
    queryKey: [queryKey, id],
    queryFn: () => api.getTemplate(id),
    select: (res) => res.data,
  });

function useTemplateMutation<TVariables, TResult>(mutationFn: (v: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
}

export const useCreateTemplate = () => useTemplateMutation(api.createTemplate);

export const useUpdateTemplate = () =>
  useTemplateMutation(
    ({ id, data }: { id: string; data: Parameters<typeof api.updateTemplate>[1] }) =>
      api.updateTemplate(id, data)
  );

export const useDuplicateTemplate = () => useTemplateMutation(api.duplicateTemplate);

export const useDeleteTemplate = () => useTemplateMutation(api.deleteTemplate);
