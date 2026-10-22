"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

/**
 * All-or-nothing server-side: the batch is rejected outright if any role is
 * still assigned to a user, is the super-admin role, or no longer exists.
 */
export const useBulkDeleteRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => roleApiClient.bulkDeleteRoles(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
