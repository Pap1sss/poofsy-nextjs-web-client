"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { chartColor, ChartTooltip } from "@/components/shared/chart-kit";
import { pixelDot } from "../pixel";
import type { DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { useUserSettings } from "@/features/auth";

import { geometry, monthLabel } from "../format";
import { useReducedMotion, useReport } from "../hooks";
import type { AccountBalances } from "../schema";
import { ReportSection, ReportTable } from "./report-section";

type Account = AccountBalances[number];

/** Small multiples: one one-hue line per account, never one multi-color chart of every account. */
export function AccountBalancesReport({ range }: { range: DateRange }) {
  const { locale } = useUserSettings();
  const reduced = useReducedMotion();
  const { data, isLoading, error } = useReport("account-balances", range);

  const accounts = data ?? [];
  const months = accounts[0]?.points.map((p) => p.month) ?? [];

  return (
    <ReportSection
      title="Account balances"
      description="Each account's balance at the end of every month."
      isLoading={isLoading}
      error={error}
      isEmpty={accounts.length === 0}
      emptyMessage="Add an account to track its balance over time."
      height={Math.max(220, Math.ceil(accounts.length / 2) * 150 + 56)}
      chart={
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <AccountMultiple
              key={account.account.id}
              account={account}
              locale={locale}
              reduced={reduced}
            />
          ))}
        </ul>
      }
      table={
        <ReportTable
          caption="Month-end balance by account"
          headers={["Account", ...months.map((m) => monthLabel(m, locale))]}
          rows={accounts.map((a) => ({
            key: a.account.id,
            cells: [
              a.account.name,
              ...a.points.map((p) => <MoneyDisplay key={p.month} value={p.balance} />),
            ],
          }))}
        />
      }
    />
  );
}

function AccountMultiple({
  account,
  locale,
  reduced,
}: {
  account: Account;
  locale: string;
  reduced: boolean;
}) {
  const latest = account.points.at(-1);

  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium">{account.account.name}</span>
        {latest && <MoneyDisplay value={latest.balance} className="text-sm font-semibold" />}
      </div>
      <div className="h-20" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            // Decorative inside an aria-hidden wrapper (the table view has the numbers), so it
            // mustn't take keyboard focus.
            accessibilityLayer={false}
            data={account.points.map((p) => ({
              label: monthLabel(p.month, locale),
              balance: geometry(p.balance),
              raw: p,
            }))}
            margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          >
            <XAxis dataKey="label" hide />
            {/* Each multiple keeps its own scale; negatives stay below zero. */}
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload?.raw as Account["points"][number] | undefined;
                if (!active || !point) return null;
                return (
                  <ChartTooltip
                    title={`${account.account.name}, end of ${monthLabel(point.month, locale, true)}`}
                    rows={[{ name: "Balance", color: chartColor.accent, value: point.balance }]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke={chartColor.accent}
              strokeWidth={2}
              dot={false}
              activeDot={pixelDot}
              isAnimationActive={!reduced}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </li>
  );
}
