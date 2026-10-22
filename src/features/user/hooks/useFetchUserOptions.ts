"use client";

import { useQuery, type UndefinedInitialDataOptions } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";
import { OptionResSchema } from "@/lib/schemas";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

export const getUserOptionsQueryOptions = (
  params?: Record<string, unknown>
): UndefinedInitialDataOptions<OptionResSchema> => {
  return {
    queryKey: [queryKey, "options", params],
    queryFn: () => userApiClient.fetchUserOptions(params),
    staleTime: minutesToMilliseconds(15),
    placeholderData: (previousData: OptionResSchema | undefined) => previousData,
  };
};

export const useFetchUserOptions = (params?: Record<string, unknown>) => {
  return useQuery(getUserOptionsQueryOptions(params));
};
