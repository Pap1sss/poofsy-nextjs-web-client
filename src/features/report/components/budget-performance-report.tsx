"use client";

import Link from "next/link";
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
import { routes } from "@/config/routes";
import { useUserSettings } from "@/features/auth";

import { dateLabel, geometry } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { BudgetPerformance } from "../schema";
import { ReportSection, ReportTable } from "./report-section";
import { useCompactTick } from "./use-compact-tick";

// Emphasis form: the plan is context (gray); what actually happened is the accent.
const PLANNED = { name: "Planned", color: chartColor.context };
const ACTUAL = { name: "Spent and saved", color: chartColor.accent };

const STATUS: Record<BudgetPerformance[number]["status"], string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
};

export function BudgetPerformanceReport({ range }: { range: DateRange }) {
  const { locale } = useUserSettings();
  const reduced = useReducedMotion();
  const tick = useCompactTick();
  const { data, isLoading, error } = useReport("budget-performance", range);

  const rows = data ?? [];

  return (
    <ReportSection
      title="Planned vs actual"
      description="For each cutoff budget, what you planned next to what you spent and saved."
      isLoading={isLoading}
      error={error}
      isEmpty={rows.length === 0}
      emptyMessage="Create a budget for a cutoff to compare planned and actual."
      chart={
        <div className="flex h-full flex-col gap-2">
          <ChartLegend items={[PLANNED, ACTUAL]} />
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows.map((r) => ({
                  label: dateLabel(r.start_date, locale).replace(/,? \d{4}$/, ""),
                  planned: geometry(r.planned),
                  actual: geometry(r.actual),
                  raw: r,
                }))}
                barGap={2}
              >
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={48} tickFormatter={tick} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    const row = payload?.[0]?.payload?.raw as (typeof rows)[number] | undefined;
                    if (!active || !row) return null;
                    return (
                      <ChartTooltip
                        title={row.label}
                        rows={[
                          { name: PLANNED.name, color: PLANNED.color, value: row.planned },
                          { name: "Spent", color: ACTUAL.color, value: row.spent },
                          { name: "Saved", color: ACTUAL.color, value: row.saved },
                          { name: "Income", value: row.income },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="planned"
                  name={PLANNED.name}
                  fill={PLANNED.color}
                  fillOpacity={0.45}
                  {...pixelBar}
                  maxBarSize={28}
                  isAnimationActive={!reduced}
                />
                <Bar
                  dataKey="actual"
                  name={ACTUAL.name}
                  fill={ACTUAL.color}
                  {...pixelBar}
                  maxBarSize={28}
                  isAnimationActive={!reduced}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
      table={
        <ReportTable
          caption="Planned vs actual by cutoff"
          headers={["Cutoff", "Planned", "Spent", "Saved", "Income", "Overspent"]}
          rows={rows.map((r) => ({
            key: r.budget_id,
            cells: [
              <span key="l" className="flex flex-col">
                <Link
                  href={routes.budgets.detail(r.budget_id)}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {r.label}
                </Link>
                <span className="text-muted-foreground text-xs">{STATUS[r.status]}</span>
              </span>,
              <MoneyDisplay key="p" value={r.planned} tone="neutral" />,
              <MoneyDisplay key="s" value={r.spent} tone="neutral" />,
              <MoneyDisplay key="v" value={r.saved} tone="neutral" />,
              <MoneyDisplay key="i" value={r.income} tone="neutral" />,
              r.overspent_categories === 0
                ? "None"
                : `${r.overspent_categories} ${r.overspent_categories === 1 ? "category" : "categories"}`,
            ],
          }))}
        />
      }
    />
  );
}
