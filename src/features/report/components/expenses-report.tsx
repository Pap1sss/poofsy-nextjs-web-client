"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CategoryBadge } from "@/components/shared/category-badge";
import { axisProps, chartColor, ChartTooltip, gridProps } from "@/components/shared/chart-kit";
import { pixelBar } from "../pixel";
import type { DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { useUserSettings } from "@/features/auth";

import { dateLabel, geometry, isZeroAmount, monthLabel } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { ExpensesReport as ExpensesReportData } from "../schema";
import { ReportSection, ReportTable } from "./report-section";
import { useCompactTick } from "./use-compact-tick";

export function ExpensesReport({ range }: { range: DateRange }) {
  const { locale } = useUserSettings();
  const reduced = useReducedMotion();
  const tick = useCompactTick();
  const { data, isLoading, error } = useReport("expenses", range);

  const months = data?.months ?? [];
  const largest = data?.largest ?? [];

  return (
    <ReportSection
      title="Expenses"
      description="Total spending per month, and the largest single expenses."
      isLoading={isLoading}
      error={error}
      isEmpty={months.every((m) => isZeroAmount(m.total))}
      emptyMessage="Record expenses to see your monthly spending."
      chart={
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={months.map((m) => ({
              label: monthLabel(m.month, locale),
              total: geometry(m.total),
              raw: m,
            }))}
          >
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={48} tickFormatter={tick} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload?.raw as
                  | ExpensesReportData["months"][number]
                  | undefined;
                if (!active || !row) return null;
                return (
                  <ChartTooltip
                    title={monthLabel(row.month, locale, true)}
                    rows={[{ name: "Spent", color: chartColor.accent, value: row.total }]}
                  />
                );
              }}
            />
            <Bar
              dataKey="total"
              name="Spent"
              fill={chartColor.accent}
              {...pixelBar}
              maxBarSize={36}
              isAnimationActive={!reduced}
            />
          </BarChart>
        </ResponsiveContainer>
      }
      table={
        <ReportTable
          caption="Spending by month"
          headers={["Month", "Spent"]}
          rows={months.map((m) => ({
            key: m.month,
            cells: [
              monthLabel(m.month, locale, true),
              <MoneyDisplay key="t" value={m.total} tone="neutral" />,
            ],
          }))}
        />
      }
      footer={
        largest.length > 0 && (
          <div className="px-1">
            <h3 className="mb-2 text-sm font-medium">Largest expenses</h3>
            <ReportTable
              caption="Largest expenses in this range"
              headers={["Expense", "Category", "Date", "Amount"]}
              rows={largest.map((t) => ({
                key: t.id,
                cells: [
                  t.description,
                  t.category ? (
                    <CategoryBadge key="c" name={t.category.name} color={t.category.color} />
                  ) : (
                    <span key="c" className="text-muted-foreground">
                      None
                    </span>
                  ),
                  dateLabel(t.date, locale),
                  <MoneyDisplay key="a" value={t.amount} tone="neutral" />,
                ],
              }))}
            />
          </div>
        )
      }
    />
  );
}
