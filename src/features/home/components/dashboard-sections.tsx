"use client";

import Link from "next/link";

import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { BudgetProgress } from "@/components/shared/budget-progress";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { routes } from "@/config/routes";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/features/account/schema";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { StatusBadge } from "@/features/budget/components/budget-planner";
import { WarningsPanel } from "@/features/budget/components/warnings-panel";
import { TransactionAmount } from "@/features/transaction";
import { cn } from "@/lib/utils/component";

import { daysFromToday, shortDate } from "../dates";
import type { Dashboard, DashboardBill, DashboardGoal } from "../schema";

const linkClass =
  "font-pixel text-primary inline-flex min-h-11 shrink-0 items-center text-sm whitespace-nowrap underline decoration-2 underline-offset-4 hover:decoration-highlight";

/** A dashboard panel: dialogue box with a pixel title, optional sprite and a link on the right. */
export function Section({
  id,
  title,
  sprite,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  sprite?: SpriteName;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("pixel-panel p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2 text-lg">
          {sprite && <Sprite name={sprite} size={20} />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** This cutoff's plan as RPG status bars: the categories nearest their limit first (sorted by the API). */
export function BudgetBlock({ budget }: { budget: Dashboard["budget"] }) {
  if (!budget) {
    return (
      <EmptyState
        sprite="calendar"
        title="No budget for this cutoff yet"
        description="Decide where this payday's money goes before you spend it."
        action={
          <Link href={routes.budgets.home} className={linkClass}>
            Plan this payday
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Section
        id="dashboard-budget"
        title="This cutoff's budget"
        sprite="chart"
        action={
          <Link href={routes.budgets.detail(budget.id)} className={linkClass}>
            Open planner
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <StatusBadge status={budget.status} />
          <span className="text-muted-foreground">
            Planned{" "}
            <MoneyDisplay
              value={budget.allocated}
              tone="neutral"
              className="text-foreground font-semibold"
            />
          </span>
          <span className="text-muted-foreground">
            Left to plan
            {budget.income_basis === "expected" && " (expected)"}{" "}
            <MoneyDisplay value={budget.remaining_unallocated} className="font-semibold" />
          </span>
        </div>
        {budget.allocations.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm">No categories in this budget yet.</p>
        ) : (
          <ul className="mt-5 space-y-5">
            {budget.allocations.map((allocation) => (
              <li key={allocation.id} className="space-y-2">
                <CategoryBadge name={allocation.category.name} color={allocation.category.color} />
                <BudgetProgress
                  spent={allocation.actual}
                  budget={allocation.budgeted}
                  remaining={allocation.remaining}
                  utilization={allocation.utilization}
                  status={allocation.status}
                  label={allocation.category.name}
                />
              </li>
            ))}
          </ul>
        )}
      </Section>
      <WarningsPanel warnings={budget.warnings} />
    </div>
  );
}

function billStatus(bill: DashboardBill, timeZone: string, locale: string) {
  if (bill.status === "overdue")
    return { text: `Overdue since ${shortDate(bill.due_date, locale)}`, overdue: true };
  const days = daysFromToday(bill.due_date, timeZone);
  if (days <= 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due in ${days} days`, overdue: false };
}

export function UpcomingBills({ bills }: { bills: DashboardBill[] }) {
  const { timezone, locale } = useUserSettings();

  return (
    <Section
      id="dashboard-bills"
      title="Bills due soon"
      sprite="house"
      action={
        <Link href={routes.bills} className={linkClass}>
          All bills
        </Link>
      }
    >
      {bills.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing due in the next two weeks.</p>
      ) : (
        <ul className="divide-border divide-y-2 divide-dashed">
          {bills.map((bill) => {
            const status = billStatus(bill, timezone, locale);
            return (
              <li
                key={bill.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Sprite name={status.overdue ? "alert" : "house"} size={18} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{bill.bill?.name ?? "Bill"}</p>
                    <p
                      className={cn(
                        "font-pixel text-xs",
                        status.overdue ? "text-expense" : "text-muted-foreground"
                      )}
                    >
                      {status.text}
                    </p>
                  </div>
                </div>
                <MoneyDisplay
                  value={bill.amount}
                  tone="neutral"
                  className="text-sm font-semibold"
                />
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/** Savings goals as quests: a quest log with progress tracks and the % in words beside each. */
export function GoalsList({ goals }: { goals: DashboardGoal[] }) {
  return (
    <Section
      id="dashboard-goals"
      title="Quests"
      sprite="scroll"
      action={
        <Link href={routes.savings_goals} className={linkClass}>
          All goals
        </Link>
      }
    >
      {goals.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No savings quests yet.{" "}
          <Link href={routes.savings_goals} className={linkClass}>
            Start an emergency fund
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => {
            const percent = goal.progress_percent;
            const done = percent !== null && percent >= 100;
            return (
              <li key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Sprite name={done ? "star" : "flag"} size={16} />
                    <span className="truncate font-semibold">{goal.name}</span>
                  </span>
                  <span className="font-pixel text-muted-foreground shrink-0 tabular-nums">
                    {percent === null ? "No target" : done ? "Complete" : `${Math.round(percent)}%`}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${goal.name} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent === null ? undefined : Math.min(100, Math.round(percent))}
                  className="hp-track h-3 overflow-hidden"
                >
                  <div
                    className="bg-primary h-full"
                    style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  <MoneyDisplay value={goal.saved} tone="neutral" /> of{" "}
                  <MoneyDisplay value={goal.target_amount} tone="neutral" />
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

const TYPE_SPRITE: Record<string, SpriteName> = {
  income: "coin",
  expense: "receipt",
  transfer: "swap",
  adjustment: "alert",
};

/** Phones list fewer transactions in the top card, so this range's figures stay on the first screen. */
const RECENT_ON_PHONES = 3;

/**
 * The "bag": recent transactions as an inventory list, one sprite per kind of movement. It sits inside
 * the Total money card, so it has a heading but no frame of its own.
 */
export function RecentTransactions({
  transactions,
  onAdd,
}: {
  transactions: Dashboard["recent_transactions"];
  onAdd: () => void;
}) {
  const { locale } = useUserSettings();

  return (
    <section aria-labelledby="dashboard-recent">
      <h3
        id="dashboard-recent"
        className="font-pixel text-muted-foreground flex items-center gap-2 text-sm"
      >
        <Sprite name="bag" size={16} />
        Recent transactions
      </h3>
      {transactions.length === 0 ? (
        <div className="text-muted-foreground mt-2 space-y-2 text-sm">
          <p>Your bag is empty. Nothing recorded yet.</p>
          <button type="button" onClick={onAdd} className={cn(linkClass, "min-h-11")}>
            Add your first transaction
          </button>
        </div>
      ) : (
        <ul className="divide-border mt-1 divide-y-2 divide-dashed">
          {transactions.map((t, index) => (
            <li
              key={t.id}
              className={cn(
                "flex items-center justify-between gap-3 py-2",
                index >= RECENT_ON_PHONES && "hidden lg:flex"
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-muted border-outline flex size-9 shrink-0 items-center justify-center border-2">
                  <Sprite name={TYPE_SPRITE[t.type] ?? "coin"} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.description}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {shortDate(t.transaction_date, locale)}
                    {t.category ? `, ${t.category.name}` : t.account ? `, ${t.account.name}` : ""}
                  </p>
                </div>
              </div>
              <TransactionAmount transaction={t} className="shrink-0 text-sm font-semibold" />
            </li>
          ))}
        </ul>
      )}
      {transactions.length > 0 && (
        <Link href={routes.transactions} className={linkClass}>
          All transactions
        </Link>
      )}
    </section>
  );
}

/** Each account's balance right now; it doesn't follow the date range. */
export function YourAccounts({ accounts }: { accounts: Dashboard["accounts"] }) {
  return (
    <Section
      id="dashboard-accounts"
      title="Your accounts"
      sprite="wallet"
      action={
        <Link href={routes.accounts} className={linkClass}>
          Manage accounts
        </Link>
      }
    >
      {accounts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No accounts yet.{" "}
          <Link href={routes.accounts} className={linkClass}>
            Add your first account
          </Link>
        </p>
      ) : (
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="border-border flex items-center justify-between gap-3 border-b-2 border-dashed py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="text-muted-foreground text-xs">
                  {ACCOUNT_TYPE_LABELS[account.type as AccountType] ?? account.type}
                </p>
              </div>
              <MoneyDisplay value={account.balance} className="font-stat shrink-0 text-2xl" />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** For a brand-new user: three first steps instead of a wall of zeros. */
export function GetStarted() {
  const steps: { href: string; sprite: SpriteName; title: string; text: string }[] = [
    {
      href: routes.income.home,
      sprite: "coin",
      title: "Record your income",
      text: "Add your latest payslip so we know what you have.",
    },
    {
      href: routes.budgets.home,
      sprite: "calendar",
      title: "Plan this payday",
      text: "Split this cutoff's money across your categories.",
    },
    {
      href: routes.bills,
      sprite: "house",
      title: "Add a bill",
      text: "Get reminded before internet, rent or loans are due.",
    },
  ];

  return (
    <section aria-labelledby="get-started" className="pixel-panel p-5">
      <div className="flex items-center gap-3">
        <Sprite name="mascot" size={32} />
        <h2 id="get-started" className="text-lg">
          Start here
        </h2>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="pixel-box bg-card hover:bg-accent focus-visible:outline-highlight flex h-full gap-3 p-4 outline-none focus-visible:outline-3 focus-visible:outline-offset-2"
            >
              <span className="font-pixel bg-highlight text-highlight-foreground border-outline flex size-8 shrink-0 items-center justify-center border-2 text-sm tabular-nums">
                {index + 1}
              </span>
              <span className="space-y-1">
                <span className="font-pixel flex items-center gap-2 text-sm">
                  <Sprite name={step.sprite} size={16} />
                  {step.title}
                </span>
                <span className="text-muted-foreground block text-sm">{step.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
