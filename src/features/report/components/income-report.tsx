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
import type { Money } from "@/lib/money";

import { geometry, isZeroAmount, monthLabel } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { IncomeReport as IncomeReportData } from "../schema";
import { ReportSection, ReportTable } from "./report-section";
import { useCompactTick } from "./use-compact-tick";

const SLOTS = [1, 2, 3] as const;

/**
 * Up to three sources: stacked columns in the validated slots 1–3 (alphabetical, so a source keeps its
 * color whatever the range). More sources: one-hue monthly totals, with the split in the table.
 */
export function IncomeReport({ range }: { range: DateRange }) {
  const { locale, currency } = useUserSettings();
  const reduced = useReducedMotion();
  const tick = useCompactTick();
  const { data, isLoading, error } = useReport("income", range);

  const rows = data ?? [];
  const sources = [...new Set(rows.flatMap((r) => r.sources.map((s) => s.name)))].sort((a, b) =>
    a.localeCompare(b)
  );
  const stacked = sources.length > 0 && sources.length <= SLOTS.length;
  const series = sources.map((name, i) => ({ name, color: chartColor.series(SLOTS[i] ?? 1) }));
  const amountOf = (row: IncomeReportData[number], name: string): Money =>
    row.sources.find((s) => s.name === name)?.amount ?? { amount: "0", currency };

  const chartData = rows.map((r) => ({
    label: monthLabel(r.month, locale),
    total: geometry(r.total),
    ...Object.fromEntries(sources.map((name) => [name, geometry(amountOf(r, name))])),
    raw: r,
  }));

  return (
    <ReportSection
      title="Income"
      description="What you earned each month, by income source."
      isLoading={isLoading}
      error={error}
      isEmpty={rows.every((r) => isZeroAmount(r.total))}
      emptyMessage="Record a payslip or income to see your earnings."
      chart={
        <div className="flex h-full flex-col gap-2">
          {stacked ? (
            <ChartLegend items={series} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Monthly totals across {sources.length} sources. Show the table for each source.
            </p>
          )}
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={tick} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    const row = payload?.[0]?.payload?.raw as IncomeReportData[number] | undefined;
                    if (!active || !row) return null;
                    return (
                      <ChartTooltip
                        title={monthLabel(row.month, locale, true)}
                        rows={[
                          ...series.map((s) => ({
                            name: s.name,
                            color: stacked ? s.color : undefined,
                            value: amountOf(row, s.name),
                          })),
                          { name: "Total", value: row.total },
                        ]}
                      />
                    );
                  }}
                />
                {stacked ? (
                  series.map((s) => (
                    <Bar
                      key={s.name}
                      dataKey={s.name}
                      name={s.name}
                      stackId="income"
                      fill={s.color}
                      // The 2px outline separates stacked segments; square ends throughout.
                      {...pixelBar}
                      maxBarSize={36}
                      isAnimationActive={!reduced}
                    />
                  ))
                ) : (
                  <Bar
                    dataKey="total"
                    name="Income"
                    fill={chartColor.accent}
                    {...pixelBar}
                    maxBarSize={36}
                    isAnimationActive={!reduced}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
      table={
        <ReportTable
          caption="Income by month and source"
          headers={["Month", ...sources, "Total"]}
          rows={rows.map((r) => ({
            key: r.month,
            cells: [
              monthLabel(r.month, locale, true),
              ...sources.map((name) => (
                <MoneyDisplay key={name} value={amountOf(r, name)} tone="neutral" />
              )),
              <MoneyDisplay key="t" value={r.total} tone="neutral" className="font-medium" />,
            ],
          }))}
        />
      }
    />
  );
}
