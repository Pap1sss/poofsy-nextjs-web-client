"use client";

import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { currencySymbol, parseAmountInput } from "@/lib/money";

type CurrencyInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  /** A decimal string such as "1000.50"; never a number, so nothing is lost to floating point. */
  value: string;
  onChange: (value: string) => void;
  /** Defaults to the user's base currency. */
  currency?: string;
};

/**
 * Amount entry that keeps the value as a string and emits a normalized decimal
 * (digits, one point, at most the currency's minor units). The API does the maths.
 */
export function CurrencyInput({ value, onChange, currency, onBlur, ...props }: CurrencyInputProps) {
  const settings = useUserSettings();
  const code = currency ?? settings.currency;
  const minorUnits = code === settings.currency ? settings.minorUnits : 2;

  return (
    // The same pixel box as Input (h-10, 2px border, inset shadow), so money fields line up beside others.
    <InputGroup className="bg-card dark:bg-card h-10 rounded-none border-2 shadow-[inset_2px_2px_0_0_var(--muted)]">
      <InputGroupAddon>
        <InputGroupText>{currencySymbol(code, settings.locale)}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="h-full tabular-nums"
        value={value}
        onChange={(event) => onChange(parseAmountInput(event.target.value, minorUnits))}
        onBlur={(event) => {
          // "12." -> "12", ".5" -> "0.5"
          const trimmed = value.replace(/\.$/, "").replace(/^\./, "0.");
          if (trimmed !== value) onChange(trimmed);
          onBlur?.(event);
        }}
      />
    </InputGroup>
  );
}
