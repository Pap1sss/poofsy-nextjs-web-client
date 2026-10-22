"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { activityApiClient } from "../api";

export const useFetchSystemActivityListByCauser = (causerId: string) => {
  return useQuery({
    queryKey: [queryKey, "causers", causerId],
    queryFn: () => activityApiClient.fetchSystemActivityListByCauser(causerId),
    staleTime: minutesToMilliseconds(15),
  });
};
