"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, Plus, Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import Error from "@/components/Error";
import { Sprite } from "@/components/pixel/sprites";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { segmentClass, segmentListClass } from "@/components/ui/segments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { isZero } from "@/lib/money";
import { cn } from "@/lib/utils/component";

import {
  INSTALLMENT_STATUSES,
  INSTALLMENT_STATUS_LABELS,
  PURCHASE_SORTS,
  PURCHASE_STATUSES,
  PURCHASE_STATUS_LABELS,
  SORT_LABELS,
} from "../constant";
import { usePaylaterInstallments, usePaylaterOverview, usePurchases } from "../hooks";
import type {
  PaylaterOverview,
  PaylaterPrefs,
  PurchaseFilters,
  ScheduledInstallment,
} from "../schema";
import { AccountForm } from "./AccountForm";
import { PaymentDialog, type PaymentTarget } from "./PaymentDialog";
import { PurchaseForm } from "./PurchaseForm";
import { SettingsDialog } from "./SettingsDialog";
import {
  longDate,
  monthLabel,
  ordinal,
  providerLabel,
  PurchaseRow,
  ROW_LIST,
  ScheduledRow,
} from "./paylater-bits";

// Pixel tab bar (same look as the Bills and Debts tabs).
const TAB_LIST = "pixel-box bg-muted h-11 gap-1 rounded-none p-1";
const TAB =
  "font-pixel rounded-none border-2 border-transparent px-3 data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none focus-visible:outline-3 focus-visible:outline-highlight";

const ALL = "__all__";

/** Paying one installment from a list: the dialog needs its account, scope and what's owed. */
export const installmentTarget = (item: ScheduledInstallment): PaymentTarget => ({
  accountId: item.provider.id,
  scope: { installmentId: item.id },
  label: `${item.purchase.description}, installment ${item.number}`,
  owed: item.remaining,
});

export default function PaylaterPage() {
  const overview = usePaylaterOverview();
  const [adding, setAdding] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [settings, setSettings] = useState<PaylaterPrefs | null>(null);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);

  const data = overview.data;
  const nothingYet = data && data.accounts.length === 0 && data.summary.open_purchases_count === 0;

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="PayLater"
        sprite="card"
        description="Your buy-now-pay-later plans, tracked by hand. Purchases count as spending only as you pay them."
        actions={
          <>
            <Button
              variant="outline"
              disabled={!data}
              onClick={() => data && setSettings(data.prefs)}
            >
              <Bell className="size-4" aria-hidden />
              Reminders
            </Button>
            <Button variant="outline" onClick={() => setAddingAccount(true)}>
              <Plus className="size-4" aria-hidden />
              Add account
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Record purchase
            </Button>
          </>
        }
      />

      {overview.isError && !data ? (
        <Error message={overview.error.message} />
      ) : !data ? (
        <SummarySkeleton />
      ) : nothingYet ? (
        <EmptyState
          sprite="card"
          title="No PayLater yet"
          description="Add your SPayLater, TikTok PayLater or LazPayLater account, then record what you bought and its installments."
          action={<Button onClick={() => setAddingAccount(true)}>Add a PayLater account</Button>}
        />
      ) : (
        <>
          <Summary overview={data} />

          {data.warnings.length > 0 && (
            <section
              aria-label="PayLater warnings"
              className="pixel-panel flex items-start gap-3 p-4 text-sm"
            >
              <Sprite name="alert" size={22} />
              <ul className="space-y-1">
                {data.warnings.map((w) => (
                  <li key={w.month}>
                    {monthLabel(w.month)} has{" "}
                    <MoneyDisplay value={w.amount} tone="expense" className="font-medium" /> of
                    PayLater due, more than your <MoneyDisplay value={w.limit} tone="neutral" />{" "}
                    limit.
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="overview" className={TAB}>
                Overview
              </TabsTrigger>
              <TabsTrigger value="purchases" className={TAB}>
                Purchases
              </TabsTrigger>
              <TabsTrigger value="schedule" className={TAB}>
                Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab overview={data} onPay={(item) => setPaying(installmentTarget(item))} />
            </TabsContent>
            <TabsContent value="purchases">
              <PurchasesTab overview={data} onAdd={() => setAdding(true)} />
            </TabsContent>
            <TabsContent value="schedule">
              <ScheduleTab onPay={(item) => setPaying(installmentTarget(item))} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <PurchaseForm open={adding} onOpenChange={setAdding} />
      <AccountForm open={addingAccount} onOpenChange={setAddingAccount} account={null} />
      <SettingsDialog prefs={settings} onOpenChange={(open) => !open && setSettings(null)} />
      <PaymentDialog target={paying} onOpenChange={(open) => !open && setPaying(null)} />
    </div>
  );
}

function Summary({ overview }: { overview: PaylaterOverview }) {
  const s = overview.summary;
  const next = s.next_bill;

  return (
    <section
      aria-label="PayLater summary"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
    >
      <StatCard
        sprite="card"
        label="Total outstanding"
        value={<MoneyDisplay value={s.total_outstanding} tone="expense" />}
        hint={`${s.open_purchases_count} ${s.open_purchases_count === 1 ? "plan" : "plans"} still running`}
        className="border-l-expense border-l-8"
      />
      <StatCard
        sprite="calendar"
        label="Due this month"
        value={<MoneyDisplay value={s.due_this_month} />}
        hint="Still unpaid, this calendar month"
      />
      <StatCard
        sprite="flag"
        label="Next bill"
        value={next ? <MoneyDisplay value={next.amount} /> : "None"}
        hint={
          next
            ? `${longDate(next.due_date)} · ${next.providers.map(providerLabel).join(", ")}${
                next.count > 1 ? ` · ${next.count} installments` : ""
              }`
            : "Nothing scheduled"
        }
      />
      <StatCard
        sprite="alert"
        label="Overdue"
        value={<MoneyDisplay value={s.overdue} tone={isZero(s.overdue) ? "neutral" : "expense"} />}
        hint={
          s.overdue_count > 0
            ? `${s.overdue_count} ${s.overdue_count === 1 ? "installment" : "installments"} past due`
            : "All caught up"
        }
      />
      <StatCard
        sprite="check"
        label="Total paid"
        value={<MoneyDisplay value={s.total_paid} tone="neutral" />}
        hint={
          <>
            Fees and charges in your plans: <MoneyDisplay value={s.total_charges} tone="neutral" />
          </>
        }
      />
      <StatCard
        sprite="wallet"
        label="Available credit"
        value={
          s.available_credit ? (
            <MoneyDisplay value={s.available_credit} tone="neutral" />
          ) : (
            "Not set"
          )
        }
        hint={
          s.available_credit
            ? s.available_is_estimate
              ? "Estimated: limit minus what you owe"
              : "As you entered it"
            : "Add a credit limit to an account"
        }
      />
    </section>
  );
}

function OverviewTab({
  overview,
  onPay,
}: {
  overview: PaylaterOverview;
  onPay: (item: ScheduledInstallment) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-6">
        <section aria-labelledby="pl-upcoming" className="space-y-2">
          <h2 id="pl-upcoming" className="text-lg">
            Overdue and due in the next 31 days
          </h2>
          {overview.upcoming.length === 0 ? (
            <p className="border-outline/40 text-muted-foreground border-2 border-dashed px-4 py-6 text-center text-sm">
              Nothing due soon.
            </p>
          ) : (
            <ul className={ROW_LIST}>
              {overview.upcoming.map((item) => (
                <ScheduledRow key={item.id} item={item} onPay={onPay} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="pl-months" className="space-y-2">
          <h2 id="pl-months" className="text-lg">
            Coming months
          </h2>
          <ul className={ROW_LIST}>
            {overview.months.map((m) => (
              <li key={m.month} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-pixel text-sm">{monthLabel(m.month)}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.count} {m.count === 1 ? "installment" : "installments"} · scheduled{" "}
                    <MoneyDisplay value={m.scheduled} tone="neutral" />
                  </p>
                </div>
                {m.over_limit && (
                  <span className="font-pixel bg-expense text-background border-expense border-2 px-1.5 py-0.5 text-xs">
                    Over your limit
                  </span>
                )}
                <div className="text-right">
                  <MoneyDisplay
                    value={m.remaining}
                    tone={isZero(m.remaining) ? "neutral" : "expense"}
                    className="font-stat block text-2xl leading-none"
                  />
                  <span className="text-muted-foreground text-xs">still to pay</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        <section aria-labelledby="pl-providers" className="space-y-2">
          <h2 id="pl-providers" className="text-lg">
            By provider
          </h2>
          {overview.accounts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No accounts yet.</p>
          ) : (
            <ul className={ROW_LIST}>
              {overview.accounts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={routes.paylater.provider(a.id)}
                    className="hover:bg-accent focus-visible:outline-highlight group flex items-center gap-3 px-4 py-3 outline-none focus-visible:outline-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-pixel truncate text-sm">{providerLabel(a)}</p>
                      <p className="text-muted-foreground text-xs">
                        {a.due_day && `Due every ${ordinal(a.due_day)} · `}
                        Due this month <MoneyDisplay value={a.due_this_month} tone="neutral" />
                        {!isZero(a.overdue) && (
                          <>
                            {" · "}
                            <span className="text-expense">
                              overdue <MoneyDisplay value={a.overdue} tone="expense" />
                            </span>
                          </>
                        )}
                      </p>
                      {a.available_credit && (
                        <p className="text-muted-foreground text-xs">
                          Available <MoneyDisplay value={a.available_credit} tone="neutral" />
                          {a.available_is_estimate && " (est.)"}
                        </p>
                      )}
                    </div>
                    <MoneyDisplay
                      value={a.outstanding}
                      tone={isZero(a.outstanding) ? "neutral" : "expense"}
                      className="font-stat text-2xl leading-none"
                    />
                    <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="pl-recent" className="space-y-2">
          <h2 id="pl-recent" className="text-lg">
            Recent payments
          </h2>
          {overview.recent_payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments yet.</p>
          ) : (
            <ul className={ROW_LIST}>
              {overview.recent_payments.map((p) => (
                <li
                  key={p.id}
                  className={cn("flex items-center gap-3 px-4 py-3", p.voided_at && "opacity-60")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-pixel truncate text-sm">{providerLabel(p.provider)}</p>
                    <p className="text-muted-foreground text-xs">
                      {longDate(p.payment_date)}
                      {p.voided_at && <span className="text-expense"> · voided</span>}
                    </p>
                  </div>
                  <MoneyDisplay
                    value={p.amount}
                    tone="neutral"
                    className={cn("font-stat text-xl leading-none", p.voided_at && "line-through")}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

const EMPTY_FILTERS: PurchaseFilters = {
  account_id: null,
  status: "open",
  installment_status: null,
  search: null,
  from: null,
  to: null,
  due_from: null,
  due_to: null,
  sort: "next_due",
};

function PurchasesTab({ overview, onAdd }: { overview: PaylaterOverview; onAdd: () => void }) {
  const [filters, setFilters] = useState<PurchaseFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const purchases = usePurchases(filters);
  const update = (patch: Partial<PurchaseFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const pushSearch = useDebouncedCallback(
    (value: string) => update({ search: value || null }),
    300
  );
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="space-y-4">
      <div className="pixel-panel space-y-3 p-4" role="search" aria-label="Filter purchases">
        <InputGroup className="sm:max-w-sm">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search purchases, stores and order numbers"
            placeholder="Search purchases, stores, order numbers"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pushSearch(event.target.value.trim());
            }}
          />
        </InputGroup>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FilterSelect
            label="Provider"
            value={filters.account_id ?? ALL}
            onChange={(id) => update({ account_id: id === ALL ? null : id })}
            options={[
              { value: ALL, label: "All providers" },
              ...overview.accounts.map((a) => ({ value: a.id, label: providerLabel(a) })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(status) => update({ status })}
            options={[
              { value: "open", label: "Still paying" },
              { value: "all", label: "All statuses" },
              ...PURCHASE_STATUSES.map((s) => ({ value: s, label: PURCHASE_STATUS_LABELS[s] })),
            ]}
          />
          <FilterSelect
            label="Has an installment"
            value={filters.installment_status ?? ALL}
            onChange={(s) => update({ installment_status: s === ALL ? null : s })}
            options={[
              { value: ALL, label: "Any" },
              ...INSTALLMENT_STATUSES.map((s) => ({
                value: s,
                label: INSTALLMENT_STATUS_LABELS[s],
              })),
            ]}
          />
          <FilterSelect
            label="Sort"
            value={filters.sort}
            onChange={(sort) => update({ sort })}
            options={PURCHASE_SORTS.map((s) => ({ value: s, label: SORT_LABELS[s] }))}
          />
          <DateFilter
            label="Bought from"
            value={filters.from}
            max={filters.to}
            onChange={(from) => update({ from })}
          />
          <DateFilter
            label="Bought until"
            value={filters.to}
            min={filters.from}
            onChange={(to) => update({ to })}
          />
          <DateFilter
            label="Unpaid due from"
            value={filters.due_from}
            max={filters.due_to}
            onChange={(due_from) => update({ due_from })}
          />
          <DateFilter
            label="Unpaid due until"
            value={filters.due_to}
            min={filters.due_from}
            onChange={(due_to) => update({ due_to })}
          />
        </div>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              pushSearch.cancel();
              setFilters(EMPTY_FILTERS);
            }}
          >
            <X aria-hidden />
            Clear filters
          </Button>
        )}
      </div>

      {!purchases.data ? (
        <ListSkeleton />
      ) : purchases.data.purchases.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No purchases match"
            description="Try another status or clear the filters."
          />
        ) : (
          <EmptyState
            sprite="card"
            title="Nothing to pay"
            description="Record a PayLater purchase to see its installments here."
            action={<Button onClick={onAdd}>Record purchase</Button>}
          />
        )
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {purchases.data.totals.count}{" "}
            {purchases.data.totals.count === 1 ? "purchase" : "purchases"}:{" "}
            <MoneyDisplay value={purchases.data.totals.remaining} tone="expense" /> left,{" "}
            <MoneyDisplay value={purchases.data.totals.paid} tone="neutral" /> paid.
          </p>
          <ul
            className={cn(ROW_LIST, purchases.isFetching && "opacity-70 transition-opacity")}
            aria-busy={purchases.isFetching}
          >
            {purchases.data.purchases.map((p) => (
              <PurchaseRow key={p.id} purchase={p} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const SCHEDULE_VIEWS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
] as const;

/** Every installment by month, so payment-heavy months stand out. */
function ScheduleTab({ onPay }: { onPay: (item: ScheduledInstallment) => void }) {
  const [view, setView] = useState<(typeof SCHEDULE_VIEWS)[number]["value"]>("unpaid");
  const installments = usePaylaterInstallments(view === "all" ? {} : { status: view });
  const months = new Map<string, ScheduledInstallment[]>();
  for (const item of installments.data ?? []) {
    const month = item.due_date.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), item]);
  }

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Show" className={segmentListClass}>
        {SCHEDULE_VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={view === v.value}
            onClick={() => setView(v.value)}
            className={segmentClass}
          >
            {v.label}
          </button>
        ))}
      </div>

      {!installments.data ? (
        <ListSkeleton />
      ) : months.size === 0 ? (
        <EmptyState title="Nothing here" description="No installments match this view." />
      ) : (
        [...months.entries()].map(([month, items]) => (
          <section key={month} aria-labelledby={`pl-month-${month}`} className="space-y-2">
            <h3
              id={`pl-month-${month}`}
              className="flex items-baseline gap-2 border-b-2 border-dashed pb-1 text-lg"
            >
              {monthLabel(month)}
              <span className="text-muted-foreground font-sans text-sm">
                {items.length} {items.length === 1 ? "installment" : "installments"}
              </span>
            </h3>
            <ul className={ROW_LIST}>
              {items.map((item) => (
                <ScheduledRow key={item.id} item={item} onPay={onPay} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `pl-filter-${label.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <div className="space-y-1 text-xs">
      <span className="text-muted-foreground" id={id}>
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-labelledby={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateFilter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string | null;
  min?: string | null;
  max?: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="date"
        value={value ?? ""}
        min={min ?? undefined}
        max={max ?? undefined}
        onChange={(event) => onChange(event.target.value || null)}
      />
    </label>
  );
}

function SummarySkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading PayLater"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
