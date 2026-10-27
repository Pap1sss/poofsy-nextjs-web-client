"use client";

import { useCallback } from "react";

import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { formatMoney, isNegative, type Money } from "@/lib/money";
import { HIDDEN_AMOUNT } from "@/lib/privacy";
import { cn } from "@/lib/utils/component";

type MoneyDisplayProps = {
  value: Money;
  /**
   * `auto`: negatives in red, everything else neutral (plan §4: negative values stay negative).
   * `income` / `expense`: always that colour, for amounts whose direction is known.
   */
  tone?: "auto" | "income" | "expense" | "neutral";
  /** Show "+" on positives, e.g. for a change or an income row. */
  signed?: boolean;
  /** Mask the amount, for an area whose privacy switch is on (`useHidden` in lib/privacy). */
  hidden?: boolean;
  className?: string;
};

/**
 * Renders an API amount in the user's locale with tabular figures, so columns of money line up.
 * With `hidden` it shows HIDDEN_AMOUNT instead, uncoloured, so not even the sign leaks.
 */
export function MoneyDisplay({
  value,
  tone = "auto",
  signed = false,
  hidden = false,
  className,
}: MoneyDisplayProps) {
  const { locale } = useUserSettings();
  const negative = isNegative(value);

  if (hidden) {
    return (
      <span className={cn("tabular-nums whitespace-nowrap", className)}>
        <span aria-hidden>{HIDDEN_AMOUNT}</span>
        <span className="sr-only">Amount hidden</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        tone === "income" && "text-income",
        (tone === "expense" || (tone === "auto" && negative)) && "text-expense",
        className
      )}
    >
      {formatMoney(value, locale, signed ? "exceptZero" : "auto")}
    </span>
  );
}

/** formatMoney for plain-text spots (chart labels, sentences, the poof). */
export function useFormatMoney() {
  const { locale } = useUserSettings();

  return useCallback(
    (value: Money, signDisplay?: Intl.NumberFormatOptions["signDisplay"]) =>
      formatMoney(value, locale, signDisplay),
    [locale]
  );
}
