"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { axisProps, chartColor, ChartTooltip, gridProps } from "@/components/shared/chart-kit";
import { pixelDot } from "../pixel";
import type { DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { useUserSettings } from "@/features/auth";

import { monthLabel } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { SavingsRate } from "../schema";
import { ReportSection, ReportTable } from "./report-section";

const percent = (value: number | null) => (value === null ? "No income" : `${value}%`);

export function SavingsRateReport({ range }: { range: DateRange }) {
  const { locale } = useUserSettings();
  const reduced = useReducedMotion();
  const { data, isLoading, error } = useReport("savings-rate", range);

  const rows = data ?? [];
  const isEmpty = rows.every((r) => r.rate_percent === null);
  const noIncome = rows
    .filter((r) => r.rate_percent === null)
    .map((r) => monthLabel(r.month, locale));

  return (
    <ReportSection
      title="Savings rate"
      description="The share of each month's income that went to savings and investments."
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="Record income and savings transfers to see your savings rate."
      chart={
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rows.map((r) => ({
                  label: monthLabel(r.month, locale),
                  rate: r.rate_percent,
                  raw: r,
                }))}
              >
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis
                  {...axisProps}
                  width={44}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  content={({ active, payload }) => {
                    const row = payload?.[0]?.payload?.raw as SavingsRate[number] | undefined;
                    if (!active || !row) return null;
                    return (
                      <ChartTooltip
                        title={monthLabel(row.month, locale, true)}
                        rows={[
                          {
                            name: "Savings rate",
                            color: chartColor.accent,
                            value: percent(row.rate_percent),
                          },
                          { name: "Saved", value: row.saved },
                          { name: "Income", value: row.income },
                        ]}
                      />
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Savings rate"
                  stroke={chartColor.accent}
                  strokeWidth={2}
                  dot={false}
                  activeDot={pixelDot}
                  connectNulls={false}
                  isAnimationActive={!reduced}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {noIncome.length > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              No income that month: {noIncome.join(", ")}.
            </p>
          )}
        </div>
      }
      table={
        <ReportTable
          caption="Savings rate by month"
          headers={["Month", "Income", "Saved", "Rate"]}
          rows={rows.map((r) => ({
            key: r.month,
            cells: [
              monthLabel(r.month, locale, true),
              <MoneyDisplay key="i" value={r.income} tone="neutral" />,
              <MoneyDisplay key="s" value={r.saved} tone="neutral" />,
              percent(r.rate_percent),
            ],
          }))}
        />
      }
    />
  );
}
