"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";
import { RoleEditSchema } from "../schema";

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, roleId }: { data: RoleEditSchema; roleId: string }) =>
      roleApiClient.updateRoleById(data, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
};
