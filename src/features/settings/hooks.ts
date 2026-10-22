"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authQueryKey } from "@/features/auth/constant";

import { getSettings, restoreDefaults, updateSettings } from "./api";

export const settingsQueryKey = "settings";

export const useSettings = () =>
  useQuery({ queryKey: [settingsQueryKey], queryFn: getSettings, select: (res) => res.data });

/** Saving also refreshes auth, so useUserSettings() picks up the new locale and time zone everywhere. */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (res) => {
      queryClient.setQueryData([settingsQueryKey], res);
      queryClient.invalidateQueries({ queryKey: [authQueryKey] });
      // The warning threshold and rollover rules change the planner's flags and the insights too.
      for (const key of ["dashboard", "budgets", "insights"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
};

/** Restored lists show up on every page that lists them. */
export const useRestoreDefaults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreDefaults,
    onSuccess: () => {
      for (const key of [
        "categories",
        "payment-methods",
        "deduction-types",
        "budgets",
        "transactions",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
};
