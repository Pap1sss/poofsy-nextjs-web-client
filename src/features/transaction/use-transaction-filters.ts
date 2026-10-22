"use client";

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { TRANSACTION_SORTS, TRANSACTION_TYPES } from "./constant";
import type { TransactionFilters } from "./schema";

const parsers = {
  from: parseAsString,
  to: parseAsString,
  type: parseAsStringLiteral(TRANSACTION_TYPES),
  account_id: parseAsString,
  category_id: parseAsString,
  payment_method_id: parseAsString,
  search: parseAsString,
  sort: parseAsStringLiteral(TRANSACTION_SORTS).withDefault("-transaction_date"),
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(25),
};

const FILTER_KEYS = [
  "from",
  "to",
  "type",
  "account_id",
  "category_id",
  "payment_method_id",
  "search",
] as const;

/** List filters live in the URL, so a filtered view can be bookmarked or shared. */
export function useTransactionFilters() {
  const [filters, setFilters] = useQueryStates(parsers, { history: "replace" });

  /** Any change other than paging goes back to page 1. */
  const update = (patch: Partial<TransactionFilters>) =>
    setFilters({ ...patch, ...("page" in patch ? {} : { page: 1 }) } as Parameters<
      typeof setFilters
    >[0]);

  const clear = () =>
    setFilters({ ...Object.fromEntries(FILTER_KEYS.map((key) => [key, null])), page: 1 });

  const isFiltered = FILTER_KEYS.some((key) => filters[key] !== null && filters[key] !== "");

  return { filters: filters as TransactionFilters, update, clear, isFiltered };
}
