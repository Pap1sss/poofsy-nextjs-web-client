"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authQueryKey } from "@/features/auth/constant";
import { completeOnboarding, getPresets } from "./api";

export const presetsQueryKey = "onboarding-presets";

export const usePresets = () =>
  useQuery({
    queryKey: [presetsQueryKey],
    queryFn: getPresets,
    select: (res) => res.data,
    staleTime: Infinity,
  });

/** Saves the choices; refreshing auth flips `onboarded`, which lets the app shell through. */
export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [authQueryKey] }),
  });
};
