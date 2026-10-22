"use client";

import { useQuery } from "@tanstack/react-query";
import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { notificationApiClient } from "../api";

export const useFetchNotificationList = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: [queryKey, params],
    queryFn: () => notificationApiClient.fetchNotificationList(params),
    staleTime: minutesToMilliseconds(1),
    placeholderData: (previousData) => previousData,
  });
};
