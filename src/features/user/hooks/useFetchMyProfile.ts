"use client";

import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { userApiClient } from "../api";

/** The signed-in user's own record, for the profile page. Saving a profile invalidates [queryKey]. */
export const useFetchMyProfile = () => {
  return useQuery({
    queryKey: [queryKey, "mine"],
    queryFn: userApiClient.fetchMine,
    staleTime: minutesToMilliseconds(15),
  });
};
