"use client";

import { emptyAuth, useAuthenticatedUser } from "../api/useAuthenticatedUser";

export const useUserPermissions = () => {
  const { data: { data: auth } = { success: false, message: "", data: emptyAuth } } =
    useAuthenticatedUser();

  return auth?.permissions ?? [];
};
