"use client";

import TanstackQueryMultiCombobox from "@/components/combobox/tanstack-query-multi-combobox";
import { ComboboxMultiProps } from "@/components/combobox/api-multi-select-combobox";

import TanstackQueryCombobox from "@/components/combobox/tanstack-query-combobox";
import { getRoleOptionsQueryOptions } from "../../hooks/useFetchRoleOptions";
import { ComboboxProps } from "@/components/combobox/api-combobox";

export function RoleComboboxMulti(props: ComboboxMultiProps) {
  return <TanstackQueryMultiCombobox fetcher={getRoleOptionsQueryOptions} {...props} />;
}

export function RoleCombobox(props: ComboboxProps) {
  return <TanstackQueryCombobox fetcher={getRoleOptionsQueryOptions} {...props} />;
}
