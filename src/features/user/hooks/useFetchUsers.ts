"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

export const useFetchUsers = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [queryKey, params],
    queryFn: () => userApiClient.fetchUsers(params),
    staleTime: minutesToMilliseconds(15),
    placeholderData: (previousData) => previousData,
  });
};
