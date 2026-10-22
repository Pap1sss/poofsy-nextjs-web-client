"use client";

import { MoneyDisplay } from "@/components/shared/money-display";
import type { Money } from "@/lib/money";

/**
 * Chart roles, from the dataviz method:
 * - `series(n)`: categorical slots in fixed order (never cycled). Only for charts whose series ARE the
 *   subject (cash flow: income, expenses, saved). Past 3 series, fold into "Other" or use small multiples.
 * - `accent`: the one hue for magnitude (category spending, savings rate, cutoff comparison).
 * - `context`: de-emphasis gray for the series that's only there for comparison (planned vs actual).
 * Text never wears a series color; values and labels stay in foreground/muted ink.
 */
export const chartColor = {
  series: (slot: 1 | 2 | 3 | 4 | 5) => `var(--chart-${slot})`,
  accent: "var(--primary)",
  context: "var(--muted-foreground)",
  grid: "var(--border)",
  surface: "var(--card)",
} as const;

/** Recessive axes: muted ticks, no tick lines, hairline baseline. Spread onto Recharts XAxis/YAxis. */
export const axisProps = {
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
} as const;

/** Hairline horizontal grid only. Spread onto Recharts CartesianGrid. */
export const gridProps = {
  stroke: "var(--border)",
  strokeDasharray: "0",
  vertical: false,
} as const;

/** Thin marks with 4px rounded data-ends (top for columns). */
export const barRadius: [number, number, number, number] = [4, 4, 0, 0];

type TooltipRow = { name: string; color?: string; value: Money | string | null };

/**
 * Tooltip body for Recharts' `content` prop. The caller maps the hovered datum to rows, so money is
 * always formatted by MoneyDisplay (the API's decimal strings), never by Recharts.
 */
export function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="bg-popover text-popover-foreground min-w-40 rounded-md border px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {row.color && (
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              {row.name}
            </span>
            <span className="tabular-nums">
              {row.value === null ? (
                "—"
              ) : typeof row.value === "string" ? (
                row.value
              ) : (
                <MoneyDisplay value={row.value} tone="neutral" />
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Legend that always accompanies 2+ series, so identity is never color alone. */
export function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
