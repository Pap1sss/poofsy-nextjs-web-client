"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  axisProps,
  chartColor,
  ChartLegend,
  ChartTooltip,
  gridProps,
} from "@/components/shared/chart-kit";
import { pixelBar } from "../pixel";
import type { DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { useUserSettings } from "@/features/auth";

import { geometry, isZeroAmount, monthLabel } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { CashFlow } from "../schema";
import { ReportSection, ReportTable } from "./report-section";
import { useCompactTick } from "./use-compact-tick";

// Validated categorical slots in fixed order (dataviz validator: all-pairs CVD and normal-vision pass in
// light, dark and dim). The semantic green/red tokens failed as series colors, so they stay on text only.
const SERIES = [
  { key: "income", name: "Income", color: chartColor.series(1) },
  { key: "expenses", name: "Expenses", color: chartColor.series(2) },
  { key: "saved", name: "Saved", color: chartColor.series(3) },
] as const;

export function CashFlowReport({ range }: { range: DateRange }) {
  const { locale } = useUserSettings();
  const reduced = useReducedMotion();
  const tick = useCompactTick();
  const { data, isLoading, error } = useReport("cash-flow", range);

  const rows = data ?? [];
  const isEmpty = rows.every(
    (r) => isZeroAmount(r.income) && isZeroAmount(r.expenses) && isZeroAmount(r.saved)
  );
  const chartData = rows.map((r) => ({
    label: monthLabel(r.month, locale),
    income: geometry(r.income),
    expenses: geometry(r.expenses),
    saved: geometry(r.saved),
    raw: r,
  }));

  return (
    <ReportSection
      title="Cash flow"
      description="What came in, what went out, and what you set aside each month. Transfers between your own accounts aren't counted."
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="Record income and expenses to see your cash flow."
      height={340}
      chart={
        <div className="flex h-full flex-col gap-2">
          <ChartLegend items={SERIES.map(({ name, color }) => ({ name, color }))} />
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={tick} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    const row = payload?.[0]?.payload?.raw as CashFlow[number] | undefined;
                    if (!active || !row) return null;
                    return (
                      <ChartTooltip
                        title={monthLabel(row.month, locale, true)}
                        rows={[
                          ...SERIES.map((s) => ({
                            name: s.name,
                            color: s.color,
                            value: row[s.key],
                          })),
                          { name: "Net", value: row.net },
                        ]}
                      />
                    );
                  }}
                />
                {SERIES.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    fill={s.color}
                    {...pixelBar}
                    maxBarSize={28}
                    isAnimationActive={!reduced}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
      table={
        <ReportTable
          caption="Cash flow by month"
          headers={["Month", "Income", "Expenses", "Saved", "Net"]}
          rows={rows.map((r) => ({
            key: r.month,
            cells: [
              monthLabel(r.month, locale, true),
              <MoneyDisplay key="i" value={r.income} tone="neutral" />,
              <MoneyDisplay key="e" value={r.expenses} tone="neutral" />,
              <MoneyDisplay key="s" value={r.saved} tone="neutral" />,
              <MoneyDisplay key="n" value={r.net} />,
            ],
          }))}
        />
      }
      footer={
        <div className="px-1">
          <h3 className="text-sm font-medium">Left over each month</h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {rows.map((r) => (
              <div key={r.month} className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">{monthLabel(r.month, locale)}</dt>
                <dd>
                  <MoneyDisplay value={r.net} className="font-medium" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      }
    />
  );
}
