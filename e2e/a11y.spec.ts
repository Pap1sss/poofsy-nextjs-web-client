import { expect, test } from "@playwright/test";

import { DEMO_STATE, apiGet, horizontalOverflow, seriousViolations, waitForPage } from "./helpers";

type Listed = { data: { id: string }[] };

const STATIC_PAGES = [
  "/dashboard",
  "/budgets",
  "/transactions",
  "/income",
  "/income/sources",
  "/accounts",
  "/categories",
  "/budget-templates",
  "/savings-goals",
  "/bills",
  "/calendar",
  "/reports",
  "/settings",
  "/settings/pay-schedule",
  "/settings/payment-methods",
  "/settings/deduction-types",
  "/profile",
];

test.describe("signed in", () => {
  test.use({ storageState: DEMO_STATE });

  test("every page passes axe (WCAG A/AA) and never scrolls sideways", async ({ page }, info) => {
    const budgets = await apiGet<Listed>(page, "budgets");
    const templates = await apiGet<Listed>(page, "budget-templates");
    const pages = [
      ...STATIC_PAGES,
      ...(budgets.data[0] ? [`/budgets/${budgets.data[0].id}`] : []),
      ...(templates.data[0] ? [`/budget-templates/${templates.data[0].id}`] : []),
    ];

    const failures: string[] = [];

    for (const path of pages) {
      await page.goto(path);
      await waitForPage(page);

      for (const v of await seriousViolations(page)) {
        failures.push(
          `${path}: [${v.impact}] ${v.id} — ${v.help}\n    ${v.targets.join("\n    ")}`
        );
      }

      if (info.project.name === "mobile") {
        const overflow = await horizontalOverflow(page);
        if (overflow > 0) failures.push(`${path}: scrolls sideways by ${overflow}px at 375px`);
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`text contrast holds in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem("theme", t), theme);
      const budgets = await apiGet<Listed>(page, "budgets");
      const failures: string[] = [];

      for (const path of [
        "/dashboard",
        ...(budgets.data[0] ? [`/budgets/${budgets.data[0].id}`] : []),
      ]) {
        await page.goto(path);
        await waitForPage(page);
        await expect(page.locator("html")).toHaveClass(
          new RegExp(theme === "dark" ? "dark" : "light|^(?!.*dark)")
        );

        for (const v of await seriousViolations(page, { only: ["color-contrast"] })) {
          failures.push(`${path} (${theme}): ${v.help}\n    ${v.targets.join("\n    ")}`);
        }
      }

      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
});

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const path of ["/login", "/register"]) {
    test(`${path} passes axe and fits the screen`, async ({ page }, info) => {
      await page.goto(path);
      await expect(page.getByRole("button", { name: /sign in|create account/i })).toBeVisible({
        timeout: 45_000,
      });

      const violations = await seriousViolations(page);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

      if (info.project.name === "mobile") expect(await horizontalOverflow(page)).toBe(0);
    });
  }
});
