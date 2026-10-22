import { expect, test, type Page } from "@playwright/test";

import { DEMO_STATE, apiGet, waitForPage } from "./helpers";

/**
 * Plan §7: "every button performs a real action". Clicks each visible button on each page and checks
 * that something happens: navigation, a dialog/menu/listbox/popover, a request, or a state change.
 * Writes are aborted so the demo user's data never changes. Desktop only (mobile shows the same actions).
 */
test.use({ storageState: DEMO_STATE });

type Listed = { data: { id: string }[] };

const PAGES = [
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
];

// The app shell (sidebar, header) is checked once, on the first page.
const SHELL = "[data-sidebar], header";

/** goto that tolerates a client-side navigation still finishing from the previous click. */
async function open(page: Page, path: string) {
  await page.waitForLoadState("load").catch(() => {});
  await page.goto(path).catch(() => page.goto(path));
  await waitForPage(page);
}

async function snapshot(page: Page) {
  return page.evaluate(() => ({
    url: location.href,
    overlays: document.querySelectorAll(
      "[role=dialog],[role=menu],[role=listbox],[role=alertdialog],[data-slot=popover-content],[data-slot=tooltip-content]"
    ).length,
    html: document.body.innerHTML.length,
  }));
}

test("every visible button does something", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Same actions on mobile; checked once on desktop.");
  test.setTimeout(30 * 60_000);

  // `next dev` draws its dev-tools badge over the bottom-left of the page, right on top of the
  // sidebar's user menu. It doesn't exist in production builds, so hide it for this audit.
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });

  let requests = 0;
  await page.route("**/api/**", (route) => {
    requests++;
    return route.request().method() === "GET" ? route.continue() : route.abort();
  });

  const budgets = await apiGet<Listed>(page, "budgets");
  const templates = await apiGet<Listed>(page, "budget-templates");
  const pages = [
    ...PAGES,
    ...(budgets.data[0] ? [`/budgets/${budgets.data[0].id}`] : []),
    ...(templates.data[0] ? [`/budget-templates/${templates.data[0].id}`] : []),
  ];

  const dead: string[] = [];
  const disabled: string[] = [];
  let checked = 0;

  for (const [index, path] of pages.entries()) {
    await open(page, path);

    const buttons = page.locator(
      index === 0
        ? "button:visible"
        : "main button:visible, [data-slot=sidebar-inset] button:visible"
    );
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (!(await button.isVisible().catch(() => false))) continue;
      if (index > 0 && (await button.evaluate((el, sel) => !!el.closest(sel), SHELL))) continue;

      const name = (
        (await button.getAttribute("aria-label")) ?? (await button.innerText()).trim()
      ).replace(/\s+/g, " ");
      // The option that's already selected (a pressed toggle, the active tab) has nothing left to do.
      const current = await button.evaluate(
        (el) =>
          el.getAttribute("aria-pressed") === "true" ||
          el.getAttribute("aria-selected") === "true" ||
          el.hasAttribute("aria-current") ||
          (el.getAttribute("role") === "tab" && el.getAttribute("data-state") === "active")
      );
      if (current) continue;

      if (await button.isDisabled()) {
        disabled.push(`${path}: "${name}"`);
        continue;
      }

      const before = await snapshot(page);
      const aria = await button.evaluate((el) =>
        [
          el.getAttribute("aria-expanded"),
          el.getAttribute("aria-pressed"),
          el.getAttribute("aria-checked"),
          el.getAttribute("data-state"),
        ].join("|")
      );
      const requestsBefore = requests;

      await button.click({ timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(600);

      const after = await snapshot(page);
      const ariaAfter = await button
        .evaluate((el) =>
          [
            el.getAttribute("aria-expanded"),
            el.getAttribute("aria-pressed"),
            el.getAttribute("aria-checked"),
            el.getAttribute("data-state"),
          ].join("|")
        )
        .catch(() => "gone");
      const acted =
        after.url !== before.url ||
        after.overlays > before.overlays ||
        requests > requestsBefore ||
        ariaAfter !== aria ||
        after.html !== before.html;

      if (!acted) dead.push(`${path}: "${name}"`);
      checked++;

      // Put the page back: close overlays, return from navigation.
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      if (page.url() !== before.url) await open(page, path);
    }
  }

  await info.attach("button-audit.json", {
    body: JSON.stringify({ checked, dead, disabled }, null, 2),
    contentType: "application/json",
  });
  console.log(
    `Checked ${checked} buttons. Disabled: ${disabled.length ? "\n  " + disabled.join("\n  ") : "none"}`
  );

  expect(dead, `Buttons that did nothing:\n${dead.join("\n")}`).toEqual([]);
});
