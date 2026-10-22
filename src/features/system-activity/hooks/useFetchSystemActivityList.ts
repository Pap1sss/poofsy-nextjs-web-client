"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { activityApiClient } from "../api";

export const useFetchSystemActivityList = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [queryKey, params],
    queryFn: () => activityApiClient.fetchSystemActivityList(params),
    staleTime: minutesToMilliseconds(15),
    placeholderData: (previousData) => previousData,
  });
};
