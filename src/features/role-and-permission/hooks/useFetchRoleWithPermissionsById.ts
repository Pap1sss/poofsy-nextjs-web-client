import { useQuery } from "@tanstack/react-query";

import { minutesToMilliseconds } from "@/lib/utils/date";

import { queryKey } from "../constant";
import { roleApiClient } from "../api";

export const useFetchRoleWithPermissionsById = (roleId: string) =>
  useQuery({
    queryKey: [queryKey, roleId, "permissions"],
    queryFn: () => roleApiClient.fetchRoleWithPermissionsById(roleId),
    staleTime: minutesToMilliseconds(15),
    enabled: !!roleId,
  });
