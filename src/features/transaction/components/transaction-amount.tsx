"use client";

import { MoneyDisplay } from "@/components/shared/money-display";
import { formatMoney, type Money } from "@/lib/money";

import type { Transaction } from "../schema";

const negate = (money: Money): Money => ({ ...money, amount: `-${money.amount}` });

/** The same signed amount as plain text, e.g. "-₱350.00", for the poof label. Formatting only. */
export function transactionAmountLabel(
  transaction: Pick<Transaction, "type" | "amount" | "adjustment_direction">,
  locale: string
) {
  const { type, amount, adjustment_direction } = transaction;

  if (type === "expense" || (type === "adjustment" && adjustment_direction === "decrease")) {
    return formatMoney(negate(amount), locale);
  }

  return formatMoney(amount, locale, type === "transfer" ? "auto" : "exceptZero");
}

/**
 * The API sends every amount as a positive figure; the sign shown here comes from the type.
 * Expenses read as money out (red, minus), income as money in (green, plus), transfers stay neutral.
 */
export function TransactionAmount({
  transaction,
  className,
}: {
  transaction: Pick<Transaction, "type" | "amount" | "adjustment_direction">;
  className?: string;
}) {
  const { type, amount, adjustment_direction } = transaction;

  switch (type) {
    case "expense":
      return <MoneyDisplay value={negate(amount)} tone="expense" className={className} />;
    case "income":
      return <MoneyDisplay value={amount} tone="income" signed className={className} />;
    case "adjustment":
      return adjustment_direction === "decrease" ? (
        <MoneyDisplay value={negate(amount)} tone="neutral" className={className} />
      ) : (
        <MoneyDisplay value={amount} tone="neutral" signed className={className} />
      );
    default:
      return <MoneyDisplay value={amount} tone="neutral" className={className} />;
  }
}
