"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Error from "@/components/Error";
import { ChartCard } from "@/components/shared/chart-card";
import { axisProps, chartColor, ChartTooltip } from "@/components/shared/chart-kit";
import { HideAmountsButton } from "@/components/shared/hide-amounts-button";
import { RowActionsMenu } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { dateLabel, geometry } from "@/features/report/format";
import { useReducedMotion } from "@/features/report/hooks";
import { pixelDot } from "@/features/report/pixel";
import { TransactionLedger } from "@/features/transaction";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { useHidden } from "@/lib/privacy";

import { ACCOUNT_SPRITE } from "../constant";
import { useAccount, useBalanceHistory } from "../hooks";
import { ACCOUNT_TYPE_LABELS, type Account } from "../schema";
import { AccountForm } from "./AccountForm";
import { ReconcileDialog } from "./ReconcileDialog";

const HISTORY_DAYS = 90;

/** Today and HISTORY_DAYS − 1 days before it, in the user's own time zone, as YYYY-MM-DD. */
function historyRange(timeZone: string) {
  const format = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  const to = format(new Date());
  const from = new Date(`${to}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - (HISTORY_DAYS - 1));
  return { from: from.toISOString().slice(0, 10), to };
}

/** One account: its balances, how the balance moved, and every transaction in or out of it. */
export function AccountDetailPage({ accountId }: { accountId: string }) {
  const account = useAccount(accountId);
  const hidden = useHidden("accounts");
  const [editing, setEditing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  useSetBreadcrumbTitle(account.data?.name ?? null);

  if (account.isError) return <Error message={account.error.message} />;
  if (!account.data) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const a = account.data;
  const archived = !!a.archived_at;

  return (
    <>
      <TransactionLedger
        accountId={a.id}
        balancesHidden={hidden}
        header={(ledgerActions) => (
          <>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href={routes.accounts}>
                <ArrowLeft className="size-4" aria-hidden />
                All accounts
              </Link>
            </Button>

            <PageHeader
              title={a.name}
              sprite={ACCOUNT_SPRITE[a.type]}
              description={[ACCOUNT_TYPE_LABELS[a.type], archived ? "Archived" : null, a.notes]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <>
                  <HideAmountsButton area="accounts" what="balances" className="size-10" />
                  {/* An archived account takes no new money; restore it from the Accounts page. */}
                  {!archived && ledgerActions}
                  {!archived && (
                    <RowActionsMenu
                      label={`Actions for ${a.name}`}
                      actions={[
                        { label: "Edit", onSelect: () => setEditing(true) },
                        { label: "Reconcile", onSelect: () => setReconciling(true) },
                      ]}
                    />
                  )}
                </>
              }
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatCard
                label="Current balance"
                value={
                  <MoneyDisplay
                    value={a.current_balance}
                    hidden={hidden}
                    className="font-stat text-3xl sm:text-4xl"
                  />
                }
              />
              <StatCard
                label="Starting balance"
                value={
                  <MoneyDisplay
                    value={a.starting_balance}
                    hidden={hidden}
                    className="font-stat text-3xl sm:text-4xl"
                  />
                }
                hint="Before any transaction recorded here"
              />
            </div>

            <BalanceChart account={a} hidden={hidden} />

            <h2 className="text-lg">Transactions</h2>
          </>
        )}
      />

      <AccountForm open={editing} onOpenChange={setEditing} account={a} />
      <ReconcileDialog account={reconciling ? a : null} onOpenChange={setReconciling} />
    </>
  );
}

function BalanceChart({ account, hidden }: { account: Account; hidden: boolean }) {
  const { locale, timezone } = useUserSettings();
  const reduced = useReducedMotion();
  const range = historyRange(timezone);
  const history = useBalanceHistory(account.id, range.from, range.to);

  const points = history.data ?? [];
  const last = points.at(-1);
  // Carry the last balance to today so the line reaches the right edge. Presentation only.
  const series = last && last.date !== range.to ? [...points, { ...last, date: range.to }] : points;

  return (
    <ChartCard
      title="Balance over time"
      description={`End-of-day balance over the last ${HISTORY_DAYS} days.`}
      isLoading={history.isLoading}
      error={history.error}
      isEmpty={hidden}
      emptyMessage="Balances are hidden. Show them to see this chart."
      height={200}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series.map((p) => ({
            label: dateLabel(p.date, locale),
            balance: geometry(p.balance),
            raw: p,
          }))}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <XAxis dataKey="label" {...axisProps} minTickGap={32} />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload?.raw as (typeof points)[number] | undefined;
              if (!active || !point) return null;
              return (
                <ChartTooltip
                  title={dateLabel(point.date, locale)}
                  rows={[{ name: "Balance", color: chartColor.accent, value: point.balance }]}
                />
              );
            }}
          />
          {/* A balance holds until the next transaction, so the line steps rather than slopes. */}
          <Line
            type="stepAfter"
            dataKey="balance"
            stroke={chartColor.accent}
            strokeWidth={2}
            dot={false}
            activeDot={pixelDot}
            isAnimationActive={!reduced}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
