"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userApiClient.deleteUserById(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
