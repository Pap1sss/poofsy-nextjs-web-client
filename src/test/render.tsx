import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactElement, ReactNode } from "react";

import { authQueryKey } from "@/features/auth/constant";
import type { AuthResponse } from "@/features/auth/schema/auth";

type Options = Omit<RenderOptions, "wrapper"> & {
  /** Seeds the ["auth"] query, which useUserSettings and the nav read from. */
  auth?: AuthResponse | null;
  /** Initial URL query for nuqs-backed state, e.g. "?type=expense&page=2". */
  searchParams?: string;
};

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/** Renders inside TanStack Query (no retries) and the nuqs testing adapter; returns user-event too. */
export function renderWithProviders(
  ui: ReactElement,
  { auth, searchParams = "", ...options }: Options = {}
) {
  const queryClient = makeQueryClient();
  if (auth) queryClient.setQueryData([authQueryKey], auth);

  const urlUpdates: URLSearchParams[] = [];

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter
        searchParams={searchParams}
        hasMemory
        onUrlUpdate={(event) => urlUpdates.push(event.searchParams)}
      >
        {children}
      </NuqsTestingAdapter>
    </QueryClientProvider>
  );

  return {
    user: userEvent.setup(),
    queryClient,
    urlUpdates,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
