import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const useFetchRoleById = (roleId: string) =>
  useQuery({
    queryKey: [queryKey, roleId],
    queryFn: () => roleApiClient.fetchRoleById(roleId),
    staleTime: minutesToMilliseconds(15),
    enabled: !!roleId,
  });
