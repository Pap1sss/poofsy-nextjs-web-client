"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { Autocomplete, type AutocompleteOption } from "@/components/shared/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/component";

import { SORT_LABELS, TRANSACTION_SORTS, TRANSACTION_TYPES, TYPE_LABELS } from "../constant";
import { useAccountOptions, useCategoryOptions, usePaymentMethodOptions } from "../hooks";
import type { TransactionSort, TransactionType } from "../schema";
import type { useTransactionFilters } from "../use-transaction-filters";

type FiltersState = ReturnType<typeof useTransactionFilters>;

const ALL = "__all__";

export function TransactionFilters({ filters, update, clear, isFiltered }: FiltersState) {
  const accounts = useAccountOptions();
  const categories = useCategoryOptions();
  const paymentMethods = usePaymentMethodOptions();

  const toOptions = (items: { id: string; name: string; color?: string | null }[] = []) =>
    items.map(
      (item): AutocompleteOption => ({ value: item.id, label: item.name, color: item.color })
    );

  // The box updates instantly; the URL (and so the request) waits until typing pauses.
  const [search, setSearch] = useState(filters.search ?? "");
  // Phones show only the search box until "Filters" is tapped; wider screens always show everything.
  const [expanded, setExpanded] = useState(false);
  const activeCount = (
    ["from", "to", "type", "account_id", "category_id", "payment_method_id"] as const
  ).filter((key) => filters[key]).length;
  const pushSearch = useDebouncedCallback(
    (value: string) => update({ search: value || null }),
    300
  );

  return (
    <div className="pixel-panel space-y-3 p-4" role="search" aria-label="Filter transactions">
      <div className="flex flex-wrap gap-3 sm:flex-nowrap">
        <InputGroup className="min-w-0 flex-1 sm:max-w-sm sm:flex-none">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search descriptions and notes"
            placeholder="Search descriptions and notes"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pushSearch(event.target.value.trim());
            }}
          />
        </InputGroup>

        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 sm:hidden"
          aria-expanded={expanded}
          aria-controls="transaction-filter-fields"
          onClick={() => setExpanded((open) => !open)}
        >
          <SlidersHorizontal aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="bg-highlight text-highlight-foreground px-1.5 text-xs">
              {activeCount}
            </span>
          )}
        </Button>

        <Select
          value={filters.sort ?? "-transaction_date"}
          onValueChange={(sort) => update({ sort: sort as TransactionSort })}
        >
          <SelectTrigger
            className={cn("w-full sm:flex sm:w-44", !expanded && "hidden")}
            aria-label="Sort"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSACTION_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        id="transaction-filter-fields"
        className={cn(
          "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6",
          !expanded && "hidden sm:grid"
        )}
      >
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">From</span>
          <Input
            type="date"
            value={filters.from ?? ""}
            max={filters.to ?? undefined}
            onChange={(event) => update({ from: event.target.value || null })}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">To</span>
          <Input
            type="date"
            value={filters.to ?? ""}
            min={filters.from ?? undefined}
            onChange={(event) => update({ to: event.target.value || null })}
          />
        </label>

        <div className="space-y-1 text-xs">
          <span className="text-muted-foreground" id="filter-type-label">
            Type
          </span>
          <Select
            value={filters.type ?? ALL}
            onValueChange={(type) =>
              update({ type: type === ALL ? null : (type as TransactionType) })
            }
          >
            <SelectTrigger className="w-full" aria-labelledby="filter-type-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {TRANSACTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 text-xs">
          <span className="text-muted-foreground">Account</span>
          <Autocomplete
            aria-label="Account"
            value={filters.account_id ?? ""}
            onChange={(id) => update({ account_id: id || null })}
            options={toOptions(accounts.data)}
            loading={accounts.isLoading}
            placeholder="All accounts"
            emptyMessage="No accounts match."
            clearable
          />
        </div>

        <div className="space-y-1 text-xs">
          <span className="text-muted-foreground">Category</span>
          <Autocomplete
            aria-label="Category"
            value={filters.category_id ?? ""}
            onChange={(id) => update({ category_id: id || null })}
            options={toOptions(categories.data)}
            loading={categories.isLoading}
            placeholder="All categories"
            emptyMessage="No categories match."
            clearable
          />
        </div>

        <div className="space-y-1 text-xs">
          <span className="text-muted-foreground">Payment method</span>
          <Autocomplete
            aria-label="Payment method"
            value={filters.payment_method_id ?? ""}
            onChange={(id) => update({ payment_method_id: id || null })}
            options={toOptions(paymentMethods.data)}
            loading={paymentMethods.isLoading}
            placeholder="All methods"
            emptyMessage="No payment methods match."
            clearable
          />
        </div>
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
