"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import Error from "@/components/Error";
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
  DEBT_SORTS,
  DEBT_STATUSES,
  DIRECTION_LABELS,
  DUE_FILTERS,
  DUE_LABELS,
  SORT_LABELS,
  STATUS_LABELS,
} from "../constant";
import { useDebts, useExportDebts, usePeople } from "../hooks";
import type { DebtDirection, DebtFilters, DebtSummary } from "../schema";
import { useDebtFilters } from "../use-debt-filters";
import { DebtForm } from "./DebtForm";
import { DebtRow, ROW_LIST } from "./debt-bits";

// Pixel tab bar (same look as the Bills page tabs).
const TAB_LIST = "pixel-box bg-muted h-11 gap-1 rounded-none p-1";
const TAB =
  "font-pixel rounded-none border-2 border-transparent px-3 data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none focus-visible:outline-3 focus-visible:outline-highlight";

const ALL = "__all__";

export default function DebtsPage() {
  const [adding, setAdding] = useState(false);
  const filterState = useDebtFilters();
  const debts = useDebts(filterState.filters);
  const exportCsv = useExportDebts();

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Debts"
        sprite="scroll"
        description="Money people owe you, and money you owe them. Paying back is tracked here, without counting anything twice."
        actions={
          <>
            <Button
              variant="outline"
              disabled={exportCsv.isPending}
              onClick={() =>
                exportCsv.mutate(filterState.filters, {
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              <Download className="size-4" aria-hidden />
              {exportCsv.isPending ? "Exporting..." : "Export CSV"}
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Add debt
            </Button>
          </>
        }
      />

      {debts.isError && !debts.data ? (
        <Error message={debts.error.message} />
      ) : !debts.data ? (
        <SummarySkeleton />
      ) : (
        <Summary summary={debts.data.summary} />
      )}

      <Tabs defaultValue="debts" className="space-y-4">
        <TabsList className={TAB_LIST}>
          <TabsTrigger value="debts" className={TAB}>
            Debts
          </TabsTrigger>
          <TabsTrigger value="people" className={TAB}>
            By person
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debts" className="space-y-6">
          {debts.data && debts.data.due_soon.length > 0 && (
            <section aria-labelledby="due-soon" className="space-y-2">
              <h2 id="due-soon" className="text-lg">
                Due soon or overdue
              </h2>
              <ul className={ROW_LIST}>
                {debts.data.due_soon.map((debt) => (
                  <DebtRow key={debt.id} debt={debt} />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="all-debts" className="space-y-3">
            <h2 id="all-debts" className="text-lg">
              All debts
            </h2>
            <DebtFiltersPanel {...filterState} />

            {!debts.data ? (
              <ListSkeleton />
            ) : debts.data.debts.length === 0 ? (
              filterState.isFiltered ? (
                <EmptyState
                  title="No debts match"
                  description="Try another status or clear the filters."
                  action={
                    <Button variant="outline" onClick={filterState.clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  sprite="scroll"
                  title="No open debts"
                  description="Lent someone money, or borrowed some? Add it here and record each payment as it comes."
                  action={<Button onClick={() => setAdding(true)}>Add debt</Button>}
                />
              )
            ) : (
              <ul
                className={cn(ROW_LIST, debts.isFetching && "opacity-70 transition-opacity")}
                aria-busy={debts.isFetching}
              >
                {debts.data.debts.map((debt) => (
                  <DebtRow key={debt.id} debt={debt} />
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="people">
          <PeopleList onAdd={() => setAdding(true)} />
        </TabsContent>
      </Tabs>

      <DebtForm open={adding} onOpenChange={setAdding} debt={null} />
    </div>
  );
}

/** Owed to me vs I owe, side by side, then what's late and what's done. */
function Summary({ summary }: { summary: DebtSummary }) {
  const count = (n: number, noun: string) => `${n} open ${noun}${n === 1 ? "" : "s"}`;

  return (
    <section aria-label="Debt summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <StatCard
        sprite="coin"
        label="Owed to me"
        value={<MoneyDisplay value={summary.total_receivables} tone="income" />}
        hint={count(summary.open_receivables_count, "debt")}
        className="border-l-income border-l-8"
      />
      <StatCard
        sprite="receipt"
        label="I owe"
        value={<MoneyDisplay value={summary.total_payables} tone="expense" />}
        hint={count(summary.open_payables_count, "debt")}
        className="border-l-expense border-l-8"
      />
      <StatCard
        sprite="chart"
        label="Net position"
        value={<MoneyDisplay value={summary.net_position} signed />}
        hint="Owed to me, minus what I owe"
        className="col-span-2 lg:col-span-1"
      />
      <StatCard
        sprite="alert"
        label="Overdue to me"
        value={
          <MoneyDisplay
            value={summary.overdue_receivables}
            tone={isZero(summary.overdue_receivables) ? "neutral" : "expense"}
          />
        }
        hint="Should have been paid back"
      />
      <StatCard
        sprite="alert"
        label="Overdue, I owe"
        value={
          <MoneyDisplay
            value={summary.overdue_payables}
            tone={isZero(summary.overdue_payables) ? "neutral" : "expense"}
          />
        }
        hint="Past its due date"
      />
      <StatCard
        sprite="check"
        label="Settled"
        value={summary.settled_count}
        hint={summary.settled_count === 1 ? "Debt paid in full" : "Debts paid in full"}
      />
    </section>
  );
}

function DebtFiltersPanel({
  filters,
  update,
  clear,
  isFiltered,
}: ReturnType<typeof useDebtFilters>) {
  // The box updates instantly; the URL (and so the request) waits until typing pauses.
  const [search, setSearch] = useState(filters.search ?? "");
  // Phones show the search box and direction until "Filters" is tapped.
  const [expanded, setExpanded] = useState(false);
  const pushSearch = useDebouncedCallback(
    (value: string) => update({ search: value || null }),
    300
  );
  const directions: (DebtDirection | null)[] = [null, "receivable", "payable"];

  return (
    <div className="pixel-panel space-y-3 p-4" role="search" aria-label="Filter debts">
      <div className="flex flex-wrap gap-3">
        <InputGroup className="min-w-0 flex-1 sm:max-w-sm">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search people and descriptions"
            placeholder="Search people and descriptions"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pushSearch(event.target.value.trim());
            }}
          />
        </InputGroup>

        <div role="group" aria-label="Direction" className={segmentListClass}>
          {directions.map((direction) => (
            <button
              key={direction ?? "all"}
              type="button"
              aria-pressed={filters.direction === direction}
              onClick={() => update({ direction })}
              className={segmentClass}
            >
              {direction ? DIRECTION_LABELS[direction] : "All"}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 sm:hidden"
          aria-expanded={expanded}
          aria-controls="debt-filter-fields"
          onClick={() => setExpanded((open) => !open)}
        >
          <SlidersHorizontal aria-hidden />
          Filters
        </Button>
      </div>

      <div
        id="debt-filter-fields"
        className={cn("grid grid-cols-2 gap-3 md:grid-cols-5", !expanded && "hidden sm:grid")}
      >
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(status) => update({ status: status as DebtFilters["status"] })}
          options={[
            { value: "open", label: "Still owed" },
            { value: "all", label: "All statuses" },
            ...DEBT_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          ]}
        />
        <FilterSelect
          label="Due"
          value={filters.due ?? ALL}
          onChange={(due) => update({ due: due === ALL ? null : due })}
          options={[
            { value: ALL, label: "Any due date" },
            ...DUE_FILTERS.map((d) => ({ value: d, label: DUE_LABELS[d] })),
          ]}
        />
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Made from</span>
          <Input
            type="date"
            value={filters.from ?? ""}
            max={filters.to ?? undefined}
            onChange={(event) => update({ from: event.target.value || null })}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Made until</span>
          <Input
            type="date"
            value={filters.to ?? ""}
            min={filters.from ?? undefined}
            onChange={(event) => update({ to: event.target.value || null })}
          />
        </label>
        <FilterSelect
          label="Sort"
          value={filters.sort}
          onChange={(sort) => update({ sort })}
          options={DEBT_SORTS.map((s) => ({ value: s, label: SORT_LABELS[s] }))}
        />
      </div>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            pushSearch.cancel();
            clear();
          }}
        >
          <X aria-hidden />
          Clear filters
        </Button>
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
  const id = `debt-filter-${label.toLowerCase()}`;

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

/** Everyone with debts, both directions shown apart: what they owe you never cancels what you owe them. */
function PeopleList({ onAdd }: { onAdd: () => void }) {
  const people = usePeople();

  if (people.isError) return <Error message={people.error.message} />;
  if (people.isLoading) return <ListSkeleton />;
  if (!people.data?.length) {
    return (
      <EmptyState
        title="Nobody here yet"
        description="People appear here once you add a debt with them."
        action={<Button onClick={onAdd}>Add debt</Button>}
      />
    );
  }

  return (
    <ul className={ROW_LIST}>
      {people.data.map((person) => (
        <li key={person.id}>
          <Link
            href={routes.debts.person(person.id)}
            className="hover:bg-accent focus-visible:outline-highlight group flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 outline-none focus-visible:outline-3 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-pixel truncate text-base">{person.name}</p>
              <p className="text-muted-foreground text-xs">
                {person.debts_count} {person.debts_count === 1 ? "debt" : "debts"}
              </p>
            </div>
            <PersonFigure
              label="Owes me"
              tone="income"
              value={person.totals.receivable.remaining}
            />
            <PersonFigure label="I owe" tone="expense" value={person.totals.payable.remaining} />
            <ChevronRight
              className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PersonFigure({
  label,
  value,
  tone,
}: {
  label: string;
  value: DebtSummary["total_receivables"];
  tone: "income" | "expense";
}) {
  return (
    <div className="w-28 text-right">
      <span className="font-pixel text-muted-foreground block text-xs">{label}</span>
      <MoneyDisplay
        value={value}
        tone={isZero(value) ? "neutral" : tone}
        className="font-stat text-2xl leading-none"
      />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading debts">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
