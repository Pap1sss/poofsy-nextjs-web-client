import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const DEMO_STATE = "e2e/.auth/demo.json";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001";

/** Waits until the app shell has rendered real content (not the auth loader). */
export async function waitForPage(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 45_000 });
  // Let queries settle so axe scans the loaded page, not skeletons.
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** axe with WCAG 2 A/AA rules; returns only serious and critical violations. */
export async function seriousViolations(page: Page, options: { only?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
  if (options.only) builder = builder.withRules(options.only);

  const { violations } = await builder.analyze();

  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
    }));
}

/** True when the page scrolls sideways (content wider than the viewport). */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return el.scrollWidth > window.innerWidth ? el.scrollWidth - window.innerWidth : 0;
  });
}

/** GET through the Next /api proxy with the page's session cookie. */
export async function apiGet<T = unknown>(page: Page, path: string): Promise<T> {
  const origin = new URL(page.url() === "about:blank" ? BASE_URL : page.url()).origin;
  const response = await page.request.get(`${origin}/api/${path.replace(/^\//, "")}`, {
    // Sanctum only reads the session cookie for a stateful origin, which it learns from Referer.
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${origin}/`,
    },
  });
  expect(response.ok(), `GET ${path} -> ${response.status()}`).toBeTruthy();
  return (await response.json()) as T;
}
