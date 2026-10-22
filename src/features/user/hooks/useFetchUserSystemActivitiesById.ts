"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

export const useFetchUserSystemActivitiesById = (userId: string) => {
  return useQuery({
    queryKey: [queryKey, "system-activities", userId],
    queryFn: () => userApiClient.fetchUserSystemActivitiesById(userId),
    staleTime: minutesToMilliseconds(15),
    enabled: !!userId,
  });
};
