"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./client";

export const client = queryClient;

export const TanstackQueryProvider = ({ children }: { children: Readonly<React.ReactNode> }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
