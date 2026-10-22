"use client";

import TanstackQueryMultiCombobox from "@/components/combobox/tanstack-query-multi-combobox";
import { ComboboxMultiProps } from "@/components/combobox/api-multi-select-combobox";

import TanstackQueryCombobox from "@/components/combobox/tanstack-query-combobox";
import { getUserOptionsQueryOptions } from "../../hooks/useFetchUserOptions";
import { ComboboxProps } from "@/components/combobox/api-combobox";

export function UserComboboxMulti(props: ComboboxMultiProps) {
  return <TanstackQueryMultiCombobox fetcher={getUserOptionsQueryOptions} {...props} />;
}

export function UserCombobox(props: ComboboxProps) {
  return <TanstackQueryCombobox fetcher={getUserOptionsQueryOptions} {...props} />;
}
