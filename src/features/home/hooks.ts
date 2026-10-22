"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getCurrentPeriod, getDashboard, getInsights } from "./api";
import { dashboardQueryKey, insightsQueryKey } from "./constant";

export const useDashboard = (range: { from: string; to: string } | null) =>
  useQuery({
    queryKey: [dashboardQueryKey, range ?? "current"],
    queryFn: () => getDashboard(range),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });

export const useInsights = () =>
  useQuery({
    queryKey: [insightsQueryKey],
    queryFn: getInsights,
    select: (res) => res.data,
    refetchOnWindowFocus: true,
  });

export const useCurrentPeriod = () =>
  useQuery({
    queryKey: [dashboardQueryKey, "current-period"],
    queryFn: getCurrentPeriod,
    select: (res) => res.data,
    staleTime: 1000 * 60 * 10,
  });
