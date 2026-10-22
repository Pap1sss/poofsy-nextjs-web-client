"use client";

import Link from "next/link";

import { MoneyDisplay } from "@/components/shared/money-display";
import { routes } from "@/config/routes";
import type { Money } from "@/lib/money";
import { cn } from "@/lib/utils/component";

import type { Dashboard } from "../schema";
import { Section } from "./dashboard-sections";

type Row = Dashboard["spending_by_category"][number];

/** Rows shown before "N more in Reports"; the dashboard is a glance, Reports has the full list. */
const MAX_ROWS = 6;

const linkClass =
  "font-pixel text-primary inline-flex min-h-11 shrink-0 items-center text-sm whitespace-nowrap underline decoration-2 underline-offset-4 hover:decoration-highlight";

/** "62%", or "<1%" for a sliver; the share itself comes from the API. */
const shareLabel = (share: number | null) =>
  share === null ? "—" : share > 0 && share < 1 ? "<1%" : `${Math.round(share)}%`;

/**
 * Where this range's spending went: a ranked part-to-whole list (dataviz: ranking + share of a
 * whole, one series, so a single validated hue, --chart-1, on a meter track). Every figure is
 * printed as text, so the list is its own table view; the category colour is only an identity
 * swatch, never the bar. Each row opens that category's transactions for the same dates.
 */
export function SpendingChart({
  rows,
  total,
  range,
}: {
  rows: Row[];
  /** Total expenses in the range (the dashboard's "spent"), which the shares add up to. */
  total: Money;
  range: Dashboard["range"];
}) {
  const top = rows.slice(0, MAX_ROWS);
  const more = rows.length - top.length;

  return (
    <Section
      id="dashboard-spending"
      title="Where the money went"
      sprite="receipt"
      action={
        <Link href={routes.reports} className={linkClass}>
          Reports
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No spending in this range yet. Expenses you record show up here, by category.
        </p>
      ) : (
        <>
          <div className="border-border flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-2 border-dashed pb-3">
            <p className="text-muted-foreground text-sm">
              Spent across {rows.length} {rows.length === 1 ? "category" : "categories"}
            </p>
            <MoneyDisplay
              value={total}
              tone="neutral"
              className="font-stat text-4xl leading-none"
            />
          </div>

          <ol aria-label="Spending by category, largest first" className="mt-1">
            {top.map((row) => (
              <li key={row.category.id ?? row.category.name}>
                <SpendingRow row={row} range={range} />
              </li>
            ))}
          </ol>

          {more > 0 && (
            <p className="text-muted-foreground border-border border-t-2 border-dashed pt-1 text-sm">
              +{more} more {more === 1 ? "category" : "categories"} in{" "}
              <Link href={routes.reports} className={linkClass}>
                Reports
              </Link>
            </p>
          )}
        </>
      )}
    </Section>
  );
}

function SpendingRow({ row, range }: { row: Row; range: Dashboard["range"] }) {
  const share = row.share_percent ?? 0;
  const content = (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="border-outline size-3 shrink-0 border-2"
          style={{ backgroundColor: row.category.color ?? "var(--muted-foreground)" }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.category.name}</span>
        <MoneyDisplay value={row.amount} tone="neutral" className="text-sm font-semibold" />
        <span className="text-muted-foreground w-10 shrink-0 text-right text-xs tabular-nums">
          {shareLabel(row.share_percent)}
        </span>
      </div>
      {/* Share of the total as a pixel meter; the printed % above carries the value. */}
      <div aria-hidden className="border-outline bg-muted mt-2 h-3 border-2">
        <div
          className="bg-chart-1 h-full"
          // A sliver stays visible, so a tiny share never reads as nothing.
          style={{ width: `${Math.min(100, Math.max(share, 1.5))}%` }}
        />
      </div>
    </>
  );

  const rowClass = "-mx-2 block px-2 py-3";

  // "Uncategorised" has no id to filter by, so it isn't a link.
  if (!row.category.id) return <div className={rowClass}>{content}</div>;

  const href = `${routes.transactions}?${new URLSearchParams({
    category_id: row.category.id,
    from: range.from,
    to: range.to,
  })}`;

  return (
    <Link
      href={href}
      className={cn(
        rowClass,
        "hover:bg-accent focus-visible:outline-highlight outline-none focus-visible:outline-3 focus-visible:-outline-offset-2"
      )}
    >
      {content}
      <span className="sr-only">, see these transactions</span>
    </Link>
  );
}
