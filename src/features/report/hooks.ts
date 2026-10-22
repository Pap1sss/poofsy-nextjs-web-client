"use client";

import { useSyncExternalStore } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { DateRange } from "@/components/shared/date-range-picker";

import { fetchReport } from "./api";
import { reportQueryKey, type ReportName } from "./constant";

export const useReport = <N extends ReportName>(name: N, range: DateRange) =>
  useQuery({
    queryKey: [reportQueryKey, name, range.from, range.to],
    queryFn: () => fetchReport(name, range),
    placeholderData: keepPreviousData,
  });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Charts skip their entrance animation when the reader asked for less motion. */
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true
  );
