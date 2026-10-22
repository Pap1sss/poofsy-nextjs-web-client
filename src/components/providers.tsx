"use client";

import { configureEcho } from "@laravel/echo-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { echoOptions } from "@/lib/laravel-echo";
import { TanstackQueryProvider } from "@/lib/tanstack-query";
import { ThemeProvider } from "@/lib/next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PoofHost } from "@/components/pixel/poof";
import { useVisualViewportHeight } from "@/hooks/use-visual-viewport-height";

configureEcho(echoOptions);

export default function AppProvider({ children }: { children: React.ReactNode }) {
  // Publishes --visual-vh so dialogs and drawers can size against the area the
  // keyboard actually leaves visible.
  useVisualViewportHeight();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      // "dim" is a softer variant of dark. It's registered as its own theme name
      // (single class — next-themes rejects space-separated tokens). The
      // `dark:` Tailwind variant is broadened in globals.css to fire under
      // `.dark` OR `.dim`, and `.dim` overrides just the surface tokens.
      themes={["light", "dark", "dim", "system"]}
      enableSystem
      disableTransitionOnChange
    >
      <TanstackQueryProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
        <PoofHost />
      </TanstackQueryProvider>
    </ThemeProvider>
  );
}
