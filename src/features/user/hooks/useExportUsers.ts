"use client";

import { useMutation } from "@tanstack/react-query";

import { userApiClient } from "../api";

/** Pass ids to export just those rows; omit for everything matching the filters. */
export const useExportUsers = () => {
  return useMutation({
    mutationFn: (ids?: string[]) => userApiClient.exportUsers(ids),
  });
};
