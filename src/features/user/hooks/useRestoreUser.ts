"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

export const useRestoreUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userApiClient.restoreUserById(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [userId] });
    },
  });
};
