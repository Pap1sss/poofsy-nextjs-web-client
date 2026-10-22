"use client";

import { CategoryBadge } from "@/components/shared/category-badge";
import { chartColor } from "@/components/shared/chart-kit";
import type { DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { geometry, isZeroAmount } from "../format";
import { useReport } from "../hooks";
import { ReportSection, ReportTable } from "./report-section";

const formatShare = (share: number | null) => (share === null ? "—" : `${share}%`);

/**
 * Magnitude, not identity: one-hue horizontal bars sorted largest first. The category's own color only
 * appears as the dot in its label, so up to 14 categories never need 14 series hues.
 */
export function CategorySpendingReport({ range }: { range: DateRange }) {
  const { data, isLoading, error } = useReport("category-spending", range);

  const categories = data?.categories ?? [];
  const isEmpty = !data || isZeroAmount(data.total);

  const bars = [
    ...(data?.top ?? []).map((c) => ({
      key: c.category.id ?? "uncategorised",
      name: c.category.name,
      color: c.category.color,
      amount: c.amount,
      share: c.share_percent,
    })),
    ...(data?.other
      ? [
          {
            key: "other",
            name: `Other (${data.other.count})`,
            color: null,
            amount: data.other.amount,
            share: data.other.share_percent,
          },
        ]
      : []),
  ];
  const max = Math.max(...bars.map((b) => geometry(b.amount)), 0);

  return (
    <ReportSection
      title="Spending by category"
      description="Where your spending went, largest first."
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="Record expenses to see where your money goes."
      height={Math.max(260, bars.length * 44 + 110)}
      chart={
        <div className="space-y-1">
          {data && (
            <p className="text-muted-foreground mb-3 text-sm">
              Total spent{" "}
              <MoneyDisplay
                value={data.total}
                tone="neutral"
                className="text-foreground font-semibold"
              />
            </p>
          )}
          <ul className="space-y-1">
            {bars.map((bar) => (
              <li key={bar.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      className="hover:bg-accent focus-visible:outline-highlight grid min-h-10 grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3 px-1 outline-none focus-visible:outline-3"
                    >
                      <CategoryBadge
                        name={bar.name}
                        color={bar.color}
                        className="justify-self-start"
                      />
                      <div
                        className="bg-muted border-outline h-4 overflow-hidden border-2"
                        aria-hidden
                      >
                        <div
                          className="border-outline h-full border-r-2"
                          style={{
                            width: `${max > 0 ? (geometry(bar.amount) / max) * 100 : 0}%`,
                            backgroundColor: chartColor.accent,
                          }}
                        />
                      </div>
                      <span className="text-right text-sm tabular-nums">
                        <MoneyDisplay value={bar.amount} tone="neutral" />
                        <span className="text-muted-foreground ml-2 hidden sm:inline">
                          {formatShare(bar.share)}
                        </span>
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {bar.name}: <MoneyDisplay value={bar.amount} tone="neutral" />,{" "}
                    {formatShare(bar.share)} of spending
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>
      }
      table={
        <ReportTable
          caption="Spending by category"
          headers={["Category", "Spent", "Share"]}
          rows={categories.map((c) => ({
            key: c.category.id ?? "uncategorised",
            cells: [
              <CategoryBadge key="c" name={c.category.name} color={c.category.color} />,
              <MoneyDisplay key="a" value={c.amount} tone="neutral" />,
              formatShare(c.share_percent),
            ],
          }))}
        />
      }
    />
  );
}
