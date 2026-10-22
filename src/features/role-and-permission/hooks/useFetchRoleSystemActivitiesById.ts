"use client";

import { useQuery } from "@tanstack/react-query";
import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const useFetchRoleSystemActivitiesById = (roleId: string) => {
  return useQuery({
    queryKey: [queryKey, "system-activities", roleId],
    queryFn: () => roleApiClient.fetchRoleSystemActivitiesById(roleId),
    staleTime: minutesToMilliseconds(15),
    enabled: !!roleId,
  });
};
