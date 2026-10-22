"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

export const useFetchUserById = (userId: string) => {
  return useQuery({
    queryKey: [queryKey, userId],
    queryFn: () => userApiClient.fetchUserById(userId),
    staleTime: minutesToMilliseconds(15),
    enabled: !!userId,
  });
};
