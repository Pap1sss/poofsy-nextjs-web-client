"use client";

import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authQueryKey } from "./useAuthenticatedUser";
import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";
import type { RegisterValues } from "../schema/auth";

const register = async (data: RegisterValues) => {
  await request({ config: { method: "GET", url: "/csrf-cookie" }, schema: z.unknown() });

  return request({
    config: { method: "POST", url: "auth/spa/register", data },
    schema: resSchema,
  });
};

/** Creates the account and signs it in; the refreshed auth state then routes to onboarding. */
export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [authQueryKey] });
    },
  });
};
