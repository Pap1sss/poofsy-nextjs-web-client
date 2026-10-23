"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { DEBT_DIRECTIONS, DEBT_SORTS, DEBT_STATUSES, DUE_FILTERS } from "./constant";
import type { DebtFilters } from "./schema";

const parsers = {
  direction: parseAsStringLiteral(DEBT_DIRECTIONS),
  // Open debts by default: what's still owed is what you look for most.
  status: parseAsStringLiteral(["open", "all", ...DEBT_STATUSES] as const).withDefault("open"),
  due: parseAsStringLiteral(DUE_FILTERS),
  from: parseAsString,
  to: parseAsString,
  search: parseAsString,
  sort: parseAsStringLiteral(DEBT_SORTS).withDefault("due_date"),
};

const FILTER_KEYS = ["direction", "due", "from", "to", "search"] as const;

/** List filters live in the URL, so coming back from a debt keeps the view you had. */
export function useDebtFilters() {
  const [filters, setFilters] = useQueryStates(parsers, { history: "replace" });

  const update = (patch: Partial<DebtFilters>) =>
    setFilters(patch as Parameters<typeof setFilters>[0]);

  const clear = () =>
    setFilters({ ...Object.fromEntries(FILTER_KEYS.map((key) => [key, null])), status: null });

  const isFiltered =
    FILTER_KEYS.some((key) => filters[key] !== null && filters[key] !== "") ||
    filters.status !== "open";

  return { filters: filters as DebtFilters, update, clear, isFiltered };
}
