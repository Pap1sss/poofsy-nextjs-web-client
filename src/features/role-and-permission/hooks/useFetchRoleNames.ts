import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const useFetchRoleNames = () =>
  useQuery({
    queryKey: [queryKey, "names"],
    queryFn: () => roleApiClient.fetchRoleNames(),
    staleTime: minutesToMilliseconds(15),
  });
