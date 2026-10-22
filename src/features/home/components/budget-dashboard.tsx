"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import Error from "@/components/Error";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker, type DateRange } from "@/components/shared/date-range-picker";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { TransactionForm } from "@/features/transaction";
import { isZero } from "@/lib/money";

import { calendarPresets } from "../dates";
import { useCurrentPeriod, useDashboard } from "../hooks";
import {
  BudgetBlock,
  GetStarted,
  GoalsList,
  RecentTransactions,
  UpcomingBills,
} from "./dashboard-sections";
import { InsightsList } from "./insights-list";
import { SpendingChart } from "./spending-chart";
import { TotalMoney } from "./total-money";

/** The budget dashboard: what you have across your accounts, and what came in and went out this range (GET /dashboard). */
export function BudgetDashboard({ greeting }: { greeting: string }) {
  const { timezone } = useUserSettings();
  // null = this cutoff; the API picks it in the user's time zone.
  const [range, setRange] = useState<DateRange | null>(null);
  const [adding, setAdding] = useState(false);

  const dashboard = useDashboard(range);
  const currentPeriod = useCurrentPeriod();
  const data = dashboard.data;

  const presets = useMemo(() => {
    const cutoff = currentPeriod.data
      ? [
          {
            label: "This cutoff",
            from: currentPeriod.data.start_date,
            to: currentPeriod.data.end_date,
          },
        ]
      : [];
    return [...cutoff, ...calendarPresets(timezone)];
  }, [currentPeriod.data, timezone]);

  const pickerValue: DateRange = range ?? {
    from: data?.range.from ?? currentPeriod.data?.start_date ?? "",
    to: data?.range.to ?? currentPeriod.data?.end_date ?? "",
  };

  const choose = (next: DateRange) => {
    const isCutoff =
      currentPeriod.data &&
      next.from === currentPeriod.data.start_date &&
      next.to === currentPeriod.data.end_date;
    setRange(isCutoff ? null : next);
  };

  if (dashboard.isError && !data) return <Error message={dashboard.error.message} />;

  const isNew = !!data && data.recent_transactions.length === 0 && isZero(data.income.actual);
  const rangeLabel =
    data?.range.pay_period?.label ??
    presets.find((p) => p.from === pickerValue.from && p.to === pickerValue.to)?.label;

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title={greeting}
        description={rangeLabel ? `Showing ${rangeLabel}` : "Your money at a glance"}
        actions={
          <>
            {pickerValue.from && (
              <DateRangePicker value={pickerValue} onChange={choose} presets={presets} />
            )}
            <Button onClick={() => setAdding(true)} className="min-h-11">
              <Plus className="size-4" aria-hidden />
              Add transaction
            </Button>
          </>
        }
      />

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="space-y-4">
            {/* The headline is what you have right now; the cards below track the chosen range. */}
            <TotalMoney netWorth={data.net_worth} accounts={data.accounts} />

            <section aria-labelledby="money-in-out" className="space-y-3">
              <h2 id="money-in-out" className="flex flex-wrap items-baseline gap-x-2 text-lg">
                Money in and out
                {rangeLabel && (
                  <span className="text-muted-foreground font-sans text-sm">{rangeLabel}</span>
                )}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                  sprite="coin"
                  label="Earned"
                  value={<MoneyDisplay value={data.income.actual} tone="income" />}
                  hint={
                    data.income.expected ? (
                      <>
                        Expected <MoneyDisplay value={data.income.expected} tone="neutral" />
                      </>
                    ) : (
                      "Received in this range"
                    )
                  }
                />
                <StatCard
                  sprite="receipt"
                  label="Spent"
                  value={<MoneyDisplay value={data.spent} tone="expense" />}
                  hint="Expenses only"
                />
                <StatCard
                  sprite="piggy"
                  label="Saved"
                  value={<MoneyDisplay value={data.saved} tone="neutral" />}
                  hint="Moved to savings and investments"
                />
                <StatCard
                  sprite="wallet"
                  label="Left to spend"
                  value={<MoneyDisplay value={data.left_to_spend} />}
                  hint="Earned, minus spent and saved"
                />
              </div>
            </section>
          </div>

          {isNew && <GetStarted />}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {data.range.pay_period && <BudgetBlock budget={data.budget} />}
              {/* Rendered only once data exists; a range change keeps the previous figures until the new ones arrive. */}
              <SpendingChart
                rows={data.spending_by_category}
                total={data.spent}
                range={data.range}
              />
              <RecentTransactions
                transactions={data.recent_transactions}
                onAdd={() => setAdding(true)}
              />
            </div>
            <div className="space-y-6">
              <InsightsList />
              <UpcomingBills bills={data.upcoming_bills} />
              <GoalsList goals={data.goals} />
            </div>
          </div>
        </>
      )}

      <TransactionForm open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-16 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
