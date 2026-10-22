"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { userApiClient, type UserStatusAction } from "../api";

interface SetUserStatusInput {
  ids: string[];
  action: UserStatusAction;
}

/**
 * Deactivates or reactivates one or many users. A single id uses the per-user
 * endpoint for its friendlier message; the bulk endpoint skips users already in
 * the requested state, so mixed selections are fine.
 */
export const useSetUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, action }: SetUserStatusInput) =>
      ids.length === 1
        ? userApiClient.setUserStatus(ids[0], action)
        : userApiClient.bulkSetUserStatus(ids, action),
    onSuccess: (_data, { ids }) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      for (const id of ids) {
        queryClient.invalidateQueries({ queryKey: [id] });
      }
    },
  });
};
