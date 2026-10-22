"use client";

import * as React from "react";
import { UndefinedInitialDataOptions, useQueryClient } from "@tanstack/react-query";

import { OptionSchema, Response } from "@/lib/schemas";

import ApiCombobox, { ApiComboboxProps } from "./api-combobox";

type OptionsResponse = Response & { data: OptionSchema[] };
type Search = { search: string };
type Fetcher = (search: Search) => UndefinedInitialDataOptions<OptionsResponse>;

type TanstackQueryComboboxProps = {
  fetcher: Fetcher;
} & Omit<ApiComboboxProps, "onSearch">;

export default function TanstackQueryCombobox({
  fetcher,

  ...props
}: TanstackQueryComboboxProps) {
  const queryClient = useQueryClient();

  const onSearch = React.useCallback(
    async (searchString: string): Promise<OptionSchema[]> => {
      const response = await queryClient.fetchQuery(fetcher({ search: searchString }));

      return response.data;
    },
    [queryClient, fetcher]
  );

  return <ApiCombobox onSearch={onSearch} {...props} />;
}
