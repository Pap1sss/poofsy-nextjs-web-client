import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Unit and component tests (Vitest + React Testing Library + MSW). Playwright e2e lives in e2e/.
export default defineConfig({
  plugins: [tsconfigPaths()],
  // tsconfig keeps JSX for Next ("preserve"); tests need it compiled.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost:3001/" } },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    // Money and dates are formatted for the user's zone; keep the machine's zone out of it.
    env: { TZ: "Asia/Manila" },
    restoreMocks: true,
  },
});
