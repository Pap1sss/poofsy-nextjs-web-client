"use client";

import { useMutation } from "@tanstack/react-query";

import { userApiClient } from "../api";

/**
 * Admin action. No cache invalidation: sending a link changes nothing about the
 * user row, only what lands in their inbox.
 */
export const useSendPasswordResetLink = (userId: string) => {
  return useMutation({
    mutationFn: () => userApiClient.sendPasswordResetLink(userId),
  });
};
