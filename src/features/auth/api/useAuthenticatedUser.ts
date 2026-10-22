"use client";

import { useQuery } from "@tanstack/react-query";

import { logInDevelopment } from "@/utils";
import { AuthResponse, authResponseSchema } from "@/features/auth/schema/auth";
import axios from "@/lib/axios";
import { authQueryKey } from "../constant";

export const emptyAuth = {
  id: "",
  email: "",
  username: "",
  name: "",
  roles: [],
  permissions: [],
  onboarded: false,
  settings: null,
};

const getAuthenticatedUser = async (): Promise<AuthResponse> => {
  const response = await axios.get<unknown>("auth/spa/authenticate");

  const validatedResponse = authResponseSchema.safeParse(response.data);

  if (!validatedResponse.success) {
    logInDevelopment(`useGetAuthenticated user : ${validatedResponse.error.message}`);

    return {
      success: false,
      message: "Parse error. Invalid response format",
      data: emptyAuth,
    };
  }

  return validatedResponse.data;
};

export { authQueryKey };

export const useAuthenticatedUser = () =>
  useQuery<AuthResponse>({
    queryKey: [authQueryKey],
    queryFn: getAuthenticatedUser,
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
