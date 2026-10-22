import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const useFetchRoles = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: [queryKey, params],
    queryFn: () => roleApiClient.fetchRoles(params),
    staleTime: minutesToMilliseconds(15),
  });
