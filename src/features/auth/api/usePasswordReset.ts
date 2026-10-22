"use client";

import { useMutation } from "@tanstack/react-query";

import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

const baseUrl = "auth/password";

/**
 * Public "forgot password" form. The response is deliberately identical whether
 * or not the address has an account, so success here does not mean an email was
 * sent — never surface it as confirmation that the account exists.
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) =>
      request({
        schema: resSchema,
        config: { method: "POST", url: `${baseUrl}/forgot`, data: { email } },
      }),
  });
};

type ResetPasswordPayload = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

/** Consumes the single-use token from the emailed link. */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      request({
        schema: resSchema,
        config: { method: "POST", url: `${baseUrl}/reset`, data: payload },
      }),
  });
};
