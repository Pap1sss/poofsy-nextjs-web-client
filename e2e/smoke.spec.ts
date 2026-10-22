import { expect, test, type Page } from "@playwright/test";

import { apiGet } from "./helpers";

/**
 * The plan's smoke run (§7), through the real UI: register, salary, cutoff budget, expense,
 * transfer, pay a bill. It creates a brand-new user in the dev database on every run.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** The open create/edit form (FormShell renders a dialog or a sheet). */
const form = (page: Page) => page.getByRole("dialog");

/** Opens a Radix Select inside the open form by its label and picks an option (options portal to the body). */
async function choose(page: Page, label: string | RegExp, option: string | RegExp) {
  await form(page)
    .getByLabel(label, { exact: typeof label === "string" })
    .click();
  await page.getByRole("option", { name: option }).click();
}

test("register → salary → cutoff budget → expense → transfer → pay a bill", async ({
  page,
}, info) => {
  const email = `e2e+${Date.now()}-${info.project.name}@example.com`;

  await test.step("register", async () => {
    await page.goto("/register");
    await page.getByLabel("First name").fill("Juana");
    await page.getByLabel("Last name").fill("Dela Cruz");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Secret123!!");
    await page.getByLabel("Confirm password").fill("Secret123!!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/onboarding/);
  });

  await test.step("onboard with the Philippines preset, paid on the 15th and last day", async () => {
    await page.getByRole("radio", { name: /^Philippines/ }).click();
    await expect(page.getByLabel("Currency")).toHaveValue(/PHP/);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "When you get paid" })).toBeVisible();
    await expect(
      page.getByText("You're paid twice a month, on the 15th and on the last day.")
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Finish setup" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  await test.step("add a salary source and record a payslip", async () => {
    await page.goto("/income/sources");
    await page.getByRole("button", { name: "Add income source" }).first().click();
    await form(page).getByLabel("Name").fill("Salary");
    await form(page).getByLabel("Expected gross").fill("15000");
    await form(page).getByLabel("Expected take-home").fill("12106.59");
    await form(page).getByRole("button", { name: "Add income source" }).click();
    await expect(
      page.getByText("Salary", { exact: true }).filter({ visible: true }).first()
    ).toBeVisible();

    await page.goto("/income");
    await page.getByRole("button", { name: "Record income" }).first().click();
    await choose(page, "Income source", "Salary");
    await choose(page, "Paid into", "Cash on hand");
    await form(page).getByLabel("Gross pay").fill("15000");
    await form(page).getByRole("button", { name: "Add deduction" }).click();
    await choose(page, "Deduction 1 type", "SSS");
    await form(page).getByLabel("Deduction 1 amount").fill("2893.41");
    await form(page).getByRole("button", { name: "Record income" }).click();
    await expect(form(page)).toBeHidden();
    await expect(page.getByText("12,106.59").filter({ visible: true }).first()).toBeVisible();
  });

  await test.step("create this cutoff's budget from the default template", async () => {
    await page.goto("/budgets");
    await page.getByRole("button", { name: "Create budget" }).click();
    await expect(page.getByText("Food Allowance").filter({ visible: true }).first()).toBeVisible();
  });

  await test.step("open a savings account", async () => {
    await page.goto("/accounts");
    await page.getByRole("button", { name: "Add account" }).first().click();
    await form(page).getByLabel("Name").fill("MariBank savings");
    await choose(page, "Type", "Savings");
    await form(page).getByRole("button", { name: "Add account" }).click();
    await expect(
      page.getByText("MariBank savings").filter({ visible: true }).first()
    ).toBeVisible();
  });

  await test.step("add an expense and a transfer to savings", async () => {
    await page.goto("/transactions");

    await page.getByRole("button", { name: "Add transaction" }).first().click();
    await form(page).getByLabel("Amount").fill("350");
    await form(page).getByLabel("Description").fill("Groceries");
    await choose(page, "Paid from", "Cash on hand");
    await choose(page, "Category", "Food Allowance");
    await form(page).getByRole("button", { name: "Add transaction" }).click();
    await expect(form(page)).toBeHidden();
    await expect(page.getByText("Groceries").filter({ visible: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Add transaction" }).first().click();
    await form(page)
      .getByRole("radio", { name: /^Transfer/ })
      .click();
    await form(page).getByLabel("Amount").fill("500");
    await form(page).getByLabel("Description").fill("Savings");
    await choose(page, "From account", "Cash on hand");
    await choose(page, "To account", "MariBank savings");
    await choose(page, "Savings or investment category", "MariBank");
    await form(page).getByRole("button", { name: "Add transaction" }).click();
    await expect(form(page)).toBeHidden();
  });

  await test.step("add a monthly bill and pay it", async () => {
    await page.goto("/bills");
    await page.getByRole("button", { name: "Add bill" }).first().click();
    await form(page).getByLabel("Name").fill("PLDT Fiber");
    await form(page).getByLabel("Usual amount").fill("1699");
    await choose(page, "Usually paid from (optional)", "Cash on hand");
    await form(page).getByRole("button", { name: "Add bill" }).click();
    await expect(form(page)).toBeHidden();

    await page.getByRole("button", { name: "Mark as paid" }).first().click();
    await form(page).getByRole("button", { name: "Mark as paid" }).click();
    await expect(form(page)).toBeHidden();
    await page.getByRole("tab", { name: "Paid" }).click();
    await expect(page.getByText("PLDT Fiber").filter({ visible: true }).first()).toBeVisible();
  });

  await test.step("the budget shows the expense against its category", async () => {
    await page.goto("/budgets");
    const food = page
      .getByRole("listitem")
      .filter({ hasText: "Food Allowance", visible: true })
      .first();
    await expect(food).toContainText("350.00");
  });

  await test.step("the dashboard's left-to-spend matches the API", async () => {
    await page.goto("/dashboard");
    const hero = page.getByRole("region", { name: "Left to spend" });
    await expect(hero).toBeVisible();

    // Read the API's figure and format it the way the page does; nothing is recomputed here.
    const { data } = await apiGet<{
      data: { left_to_spend: { amount: string; currency: string } };
    }>(page, "dashboard");
    const expected = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: data.left_to_spend.currency,
    }).format(data.left_to_spend.amount as Intl.StringNumericLiteral);

    // 15,000 − 2,893.41 deductions − 350 groceries − 1,699 bill − 500 saved.
    expect(data.left_to_spend.amount).toBe("9557.59");
    await expect(hero).toContainText(expected);
  });
});
