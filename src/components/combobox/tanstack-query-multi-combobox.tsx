"use client";

import * as React from "react";
import { UndefinedInitialDataOptions, useQueryClient } from "@tanstack/react-query";

import { OptionSchema, Response } from "@/lib/schemas";

import ApiMultiCombobox, { ApiMultiComboboxProps } from "./api-multi-select-combobox";

type OptionsResponse = Response & { data: OptionSchema[] };
type Search = { search: string };
type Fetcher = (search: Search) => UndefinedInitialDataOptions<OptionsResponse>;

type TanstackQueryMultiComboboxProps = {
  fetcher: Fetcher;
} & Omit<ApiMultiComboboxProps, "onSearch">;

export default function TanstackQueryMultiCombobox({
  fetcher,

  ...props
}: TanstackQueryMultiComboboxProps) {
  const queryClient = useQueryClient();

  const onSearch = React.useCallback(
    async (searchString: string): Promise<OptionSchema[]> => {
      const response = await queryClient.fetchQuery(fetcher({ search: searchString }));

      return response.data;
    },
    [queryClient, fetcher]
  );

  return <ApiMultiCombobox onSearch={onSearch} {...props} />;
}
