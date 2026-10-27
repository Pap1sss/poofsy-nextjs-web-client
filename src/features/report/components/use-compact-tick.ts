"use client";

import { useCallback, useMemo } from "react";

import { useUserSettings } from "@/features/auth";

/**
 * Y-axis tick labels as compact numbers ("12K"). Axis ticks are scale marks, not amounts the reader
 * acts on; exact amounts appear in tooltips, direct labels and the table, formatted from the API.
 */
export function useCompactTick(suffix = "") {
  const { locale } = useUserSettings();
  const format = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    [locale]
  );

  return useCallback((value: number) => `${format.format(value)}${suffix}`, [format, suffix]);
}
