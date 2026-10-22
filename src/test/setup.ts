import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./server";

// --- network: every request must be handled, so a missing mock fails the test loudly
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// --- Next.js app router
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(window.location.search),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// A plain <a>: tests assert where links point, not client-side navigation.
vi.mock("next/link", async () => {
  const { createElement, forwardRef } = await import("react");
  type LinkProps = Record<string, unknown> & { children?: React.ReactNode };

  return {
    default: forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
      const { href, children, prefetch, ...rest } = props;
      void prefetch; // Next-only prop; not a DOM attribute
      const target = href as string | { pathname: string };

      return createElement(
        "a",
        {
          ...rest,
          ref,
          href: typeof target === "string" ? target : target.pathname,
        } as React.ComponentProps<"a">,
        children as React.ReactNode
      );
    }),
  };
});

// lib/axios asks Echo for the socket id on every request; there's no socket in tests.
vi.mock("@laravel/echo-react", () => ({
  echo: () => ({ socketId: () => null }),
  configureEcho: vi.fn(),
  useEcho: vi.fn(),
  useEchoModel: vi.fn(),
  useEchoNotification: vi.fn(),
}));

// --- browser APIs jsdom doesn't ship
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// Radix primitives call these on open/focus.
Element.prototype.scrollIntoView ??= vi.fn();
Element.prototype.hasPointerCapture ??= vi.fn(() => false);
Element.prototype.releasePointerCapture ??= vi.fn();
