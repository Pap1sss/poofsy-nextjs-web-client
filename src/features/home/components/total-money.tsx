"use client";

import { PoofsyLogo } from "@/components/branding";
import { HideAmountsButton } from "@/components/shared/hide-amounts-button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { useHidden } from "@/lib/privacy";
import type { Money } from "@/lib/money";

import type { Dashboard } from "../schema";

/**
 * The dashboard's headline: everything you have right now across your accounts (net worth, from
 * the API). It doesn't follow the date range above.
 */
export function TotalMoney({
  netWorth,
  accounts,
  aside,
  children,
}: {
  netWorth: Money;
  accounts: Dashboard["accounts"];
  /** The right-hand column on wide screens, below the total on phones (the dashboard puts recent transactions here). */
  aside?: React.ReactNode;
  /** Shown under the total (the dashboard puts this range's figures here). */
  children?: React.ReactNode;
}) {
  const hidden = useHidden("total");

  return (
    <section
      aria-labelledby="total-money"
      className="pixel-panel relative grid gap-5 p-4 sm:p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center lg:gap-8"
    >
      {/* Privacy: hides this total (per browser), e.g. when someone can see your screen. */}
      <HideAmountsButton
        area="total"
        what="total"
        className="absolute top-2 right-2 z-10 sm:top-3 sm:right-3"
      />

      <div className="min-w-0 space-y-5">
        <div className="flex items-center gap-4 pr-10 sm:gap-5 lg:pr-0">
          <div className="bg-secondary border-outline flex size-16 shrink-0 items-center justify-center border-2 sm:size-24 [&_img]:size-12 sm:[&_img]:size-20">
            <PoofsyLogo variant="icon" size={80} alt="" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-muted-foreground text-sm">Right now</p>
            <h2 id="total-money" className="text-xl">
              Total money
            </h2>
            <p className="font-stat mt-1 text-5xl leading-none break-words sm:text-6xl md:text-7xl">
              <MoneyDisplay value={netWorth} hidden={hidden} />
            </p>
            <p className="text-muted-foreground mt-2 max-w-prose text-sm">
              Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}. Savings
              goals are part of these balances.
            </p>
          </div>
        </div>
        {children}
      </div>

      <div className="min-w-0 lg:border-l-2 lg:border-dashed lg:pl-8">{aside}</div>
    </section>
  );
}
