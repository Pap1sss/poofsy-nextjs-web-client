"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { notificationApiClient } from "../api";

export const useFetchNotificationOverview = () => {
  const { data: { data: authUser } = {} } = useAuth();

  return useQuery({
    queryKey: [queryKey, "overview", authUser?.id],
    queryFn: () => notificationApiClient.fetchNotificationOverview(),
    staleTime: minutesToMilliseconds(1),
    placeholderData: (previousData) => previousData,
    enabled: !!authUser?.id,
  });
};
