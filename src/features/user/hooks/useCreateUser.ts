import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userApiClient } from "../api";
import { UserFormSchema } from "../schema";
import { queryKey } from "../constant";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFormSchema) => userApiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });
}
