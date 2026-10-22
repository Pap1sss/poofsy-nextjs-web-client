"use client";

import { useCallback, useMemo } from "react";

import { useUserSettings } from "@/features/auth";
import { useAmountsHidden } from "@/lib/privacy";

/**
 * Y-axis tick labels as compact numbers ("12K"). Axis ticks are scale marks, not amounts the reader
 * acts on; exact amounts appear in tooltips, direct labels and the table, formatted from the API.
 * With "Hide amounts" on the ticks are blank, so the scale doesn't give the figures away.
 */
export function useCompactTick(suffix = "") {
  const { locale } = useUserSettings();
  const hidden = useAmountsHidden();
  const format = useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    [locale]
  );

  return useCallback(
    (value: number) => (hidden ? "" : `${format.format(value)}${suffix}`),
    [format, hidden, suffix]
  );
}
