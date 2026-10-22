"use client";

import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authQueryKey } from "./useAuthenticatedUser";
import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

type useLoginParamsType = {
  /** Email or username. */
  login: string;
  password: string;
};

const useLogin = async ({ login, password }: useLoginParamsType) => {
  await request({ config: { method: "GET", url: "/csrf-cookie" }, schema: z.unknown() });

  return request({
    config: { method: "POST", url: "auth/spa/login", data: { login, password } },
    schema: resSchema,
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: useLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [authQueryKey] });
    },
  });
};
