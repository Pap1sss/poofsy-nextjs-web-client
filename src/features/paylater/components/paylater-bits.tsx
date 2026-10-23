"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { routes } from "@/config/routes";
import { DebtProgress as PaidProgress, longDate } from "@/features/debt/components/debt-bits";
import { cn } from "@/lib/utils/component";

import { INSTALLMENT_STATUS_LABELS, PURCHASE_STATUS_LABELS } from "../constant";
import type {
  InstallmentStatus,
  Provider,
  Purchase,
  PurchaseStatus,
  ScheduledInstallment,
} from "../schema";

export { PaidProgress, longDate };

// Same RPG-menu list as Bills and Debts: framed panel, dashed dividers between rows.
export const ROW_LIST = "pixel-panel divide-border divide-y-2 divide-dashed px-1 py-1";

/** "2026-11" -> "November 2026". */
export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`)
  );

/** "Shopee SPayLater (main)". */
export const providerLabel = (provider: Pick<Provider, "provider_name" | "nickname">) =>
  provider.nickname ? `${provider.provider_name} (${provider.nickname})` : provider.provider_name;

/** 1st, 2nd, 3rd, 11th, 21st… */
export const ordinal = (n: number) => {
  const s =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th");
  return `${n}${s}`;
};

const INSTALLMENT_STYLE: Record<InstallmentStatus, string> = {
  upcoming: "text-foreground",
  due_soon: "text-warning",
  due: "bg-warning text-background border-warning",
  partially_paid: "text-warning",
  overdue: "bg-expense text-background border-expense",
  paid: "text-income",
  cancelled: "text-muted-foreground line-through decoration-2",
};

export function InstallmentStatusBadge({
  status,
  className,
}: {
  status: InstallmentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-pixel border-outline inline-flex items-center border-2 px-1.5 py-0.5 text-xs whitespace-nowrap",
        INSTALLMENT_STYLE[status],
        className
      )}
    >
      {status === "paid" && <Sprite name="check" size={12} className="mr-1" />}
      {INSTALLMENT_STATUS_LABELS[status]}
    </span>
  );
}

const PURCHASE_STYLE: Record<PurchaseStatus, string> = {
  active: "text-foreground",
  overdue: "bg-expense text-background border-expense",
  paid_off: "text-income",
  cancelled: "text-muted-foreground line-through decoration-2",
};

export function PurchaseStatusBadge({
  status,
  className,
}: {
  status: PurchaseStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-pixel border-outline inline-flex items-center border-2 px-1.5 py-0.5 text-xs whitespace-nowrap",
        PURCHASE_STYLE[status],
        className
      )}
    >
      {status === "paid_off" && <Sprite name="check" size={12} className="mr-1" />}
      {PURCHASE_STATUS_LABELS[status]}
    </span>
  );
}

/** One purchase in a list: what, from which provider, how far along, what's left. Opens the purchase. */
export function PurchaseRow({
  purchase,
  showProvider = true,
}: {
  purchase: Purchase;
  showProvider?: boolean;
}) {
  const closed = purchase.status === "paid_off" || purchase.status === "cancelled";

  return (
    <li>
      <Link
        href={routes.paylater.purchase(purchase.id)}
        className="hover:bg-accent focus-visible:outline-highlight group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-4 outline-none focus-visible:outline-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:px-5"
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <PurchaseStatusBadge status={purchase.status} />
            {showProvider && (
              <span className="font-pixel text-muted-foreground text-xs">
                {providerLabel(purchase.account)}
              </span>
            )}
          </div>
          <p className="font-pixel truncate text-base">{purchase.description}</p>
          <p className="text-muted-foreground text-xs">
            {purchase.paid_installments} of {purchase.installment_count} paid
            {purchase.next_due && <> · next {longDate(purchase.next_due.due_date)}</>}
            {purchase.merchant && <> · {purchase.merchant}</>}
          </p>
        </div>

        <PaidProgress
          percent={purchase.progress_percent}
          label={purchase.description}
          className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
        />

        <div className="flex items-center gap-2 text-right">
          <div>
            <MoneyDisplay
              value={purchase.remaining}
              tone={closed ? "neutral" : "expense"}
              className={cn("font-stat block text-3xl leading-none", closed && "opacity-60")}
            />
            <span className="text-muted-foreground text-xs">
              left of <MoneyDisplay value={purchase.total_repayment} tone="neutral" />
            </span>
          </div>
          <ChevronRight
            className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Link>
    </li>
  );
}

/** One installment across purchases: when, what, which provider, how much is left on it. */
export function ScheduledRow({
  item,
  onPay,
}: {
  item: ScheduledInstallment;
  onPay?: (item: ScheduledInstallment) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
      <div className="w-24 shrink-0">
        <p className="font-pixel text-sm">{longDate(item.due_date)}</p>
        <InstallmentStatusBadge status={item.status} className="mt-1" />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={routes.paylater.purchase(item.purchase.id)}
          className="font-pixel block truncate text-base hover:underline"
        >
          {item.purchase.description}
        </Link>
        <p className="text-muted-foreground text-xs">
          {providerLabel(item.provider)} · {item.number} of {item.installment_count}
        </p>
      </div>
      <MoneyDisplay
        value={item.remaining}
        tone={item.status === "paid" ? "neutral" : "expense"}
        className="font-stat text-2xl leading-none"
      />
      {onPay && item.status !== "paid" && item.status !== "cancelled" && (
        <button
          type="button"
          onClick={() => onPay(item)}
          className="font-pixel text-primary min-h-11 text-sm underline decoration-2 underline-offset-4"
        >
          Pay
        </button>
      )}
    </li>
  );
}
