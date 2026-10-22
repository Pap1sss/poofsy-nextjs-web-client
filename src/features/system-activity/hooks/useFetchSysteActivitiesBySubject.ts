"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { activityApiClient } from "../api";

export const useFetchSysteActivityListBySubject = (subjectId: string) => {
  return useQuery({
    queryKey: [queryKey, "subjects", subjectId],
    queryFn: () => activityApiClient.fetchSystemActivityListBySubject(subjectId),
    staleTime: minutesToMilliseconds(15),
  });
};
