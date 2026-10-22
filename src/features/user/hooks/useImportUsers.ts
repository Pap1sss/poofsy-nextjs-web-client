"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userApiClient } from "../api";
import { queryKey } from "../constant";

export const useImportUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userApiClient.importUsers(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
