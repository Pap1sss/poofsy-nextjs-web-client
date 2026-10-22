"use client";

import { useQuery, type UndefinedInitialDataOptions } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";
import { OptionResSchema } from "@/lib/schemas";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const getRoleOptionsQueryOptions = (
  params?: Record<string, unknown>
): UndefinedInitialDataOptions<OptionResSchema> => {
  return {
    queryKey: [queryKey, "options", params],
    queryFn: () => roleApiClient.fetchRoleOptions(params),
    staleTime: minutesToMilliseconds(15),
    placeholderData: (previousData: OptionResSchema | undefined) => previousData,
  };
};

export const useFetchRoleOptions = (params?: Record<string, unknown>) => {
  return useQuery(getRoleOptionsQueryOptions(params));
};
