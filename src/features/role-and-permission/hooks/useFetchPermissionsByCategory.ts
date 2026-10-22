import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { roleApiClient } from "../api";

export const useFetchPermissionsByCategory = () =>
  useQuery({
    queryKey: ["permissions", "by-category"],
    queryFn: () => roleApiClient.fetchPermissionsByCategory(),
    staleTime: minutesToMilliseconds(30),
  });
