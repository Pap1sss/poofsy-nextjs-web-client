"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

/**
 * Bulk mutations for the users table's selection action bar. Each is
 * all-or-nothing server-side — a stale id aborts the whole call — so on success
 * the whole list is invalidated rather than patched row by row.
 */

export const useBulkDeleteUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => userApiClient.bulkDeleteUsers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};

export const useBulkRestoreUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => userApiClient.bulkRestoreUsers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};

export const useBulkForceDeleteUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => userApiClient.bulkForceDeleteUsers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};

interface BulkSyncRolesInput {
  ids: string[];
  roles: string[];
  mode: "assign" | "remove";
}

export const useBulkSyncUserRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, roles, mode }: BulkSyncRolesInput) =>
      userApiClient.bulkSyncUserRoles(ids, roles, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
