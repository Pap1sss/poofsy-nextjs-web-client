"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => roleApiClient.deleteRoleById(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
