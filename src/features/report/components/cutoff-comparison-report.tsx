"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { axisProps, chartColor, ChartTooltip, gridProps } from "@/components/shared/chart-kit";
import { pixelBar } from "../pixel";
import type { DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { useFormatMoney } from "@/components/shared/money-display";

import { cutoffLabel, geometry, isZeroAmount } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { CutoffComparison } from "../schema";
import { ReportSection, ReportTable } from "./report-section";
import { useCompactTick } from "./use-compact-tick";

const basedOn = (count: number) => `based on ${count} ${count === 1 ? "cutoff" : "cutoffs"}`;

export function CutoffComparisonReport({ range }: { range: DateRange }) {
  const format = useFormatMoney();
  const reduced = useReducedMotion();
  const tick = useCompactTick();
  const { data, isLoading, error } = useReport("cutoff-comparison", range);

  const rows = data ?? [];

  return (
    <ReportSection
      title="1st vs 2nd cutoff"
      description="Average spending in each cutoff of the month, to show which half runs tighter."
      isLoading={isLoading}
      error={error}
      isEmpty={rows.length === 0 || rows.every((r) => isZeroAmount(r.total_spending))}
      emptyMessage="Record expenses across a few cutoffs to compare them."
      chart={
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows.map((r) => ({
                  label: cutoffLabel(r.sequence),
                  average: geometry(r.average_spending),
                  averageLabel: format(r.average_spending),
                  raw: r,
                }))}
                margin={{ top: 24 }}
              >
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={tick} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    const row = payload?.[0]?.payload?.raw as CutoffComparison[number] | undefined;
                    if (!active || !row) return null;
                    return (
                      <ChartTooltip
                        title={`${cutoffLabel(row.sequence)}, ${basedOn(row.cutoffs)}`}
                        rows={[
                          {
                            name: "Average spent",
                            color: chartColor.accent,
                            value: row.average_spending,
                          },
                          { name: "Total spent", value: row.total_spending },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="average"
                  name="Average spent"
                  fill={chartColor.accent}
                  {...pixelBar}
                  maxBarSize={72}
                  isAnimationActive={!reduced}
                >
                  {/* Direct labels: a few bars, so every value is labelled, formatted from the API string. */}
                  <LabelList
                    dataKey="averageLabel"
                    position="top"
                    fill="var(--foreground)"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {rows.map((r) => `${cutoffLabel(r.sequence)}: ${basedOn(r.cutoffs)}`).join(". ")}.
          </p>
        </div>
      }
      table={
        <ReportTable
          caption="Average spending per cutoff"
          headers={["Cutoff", "Cutoffs counted", "Average spent", "Total spent"]}
          rows={rows.map((r) => ({
            key: String(r.sequence),
            cells: [
              cutoffLabel(r.sequence),
              String(r.cutoffs),
              <MoneyDisplay key="a" value={r.average_spending} tone="neutral" />,
              <MoneyDisplay key="t" value={r.total_spending} tone="neutral" />,
            ],
          }))}
        />
      }
    />
  );
}
