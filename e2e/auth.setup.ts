import { expect, test as setup } from "@playwright/test";

import { DEMO_STATE } from "./helpers";

// Signs the seeded demo user in once and saves the session; the scan specs reuse it,
// which keeps them under the API's 5-logins-a-minute limit.
setup("sign in as the demo user", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email or username").fill("user@test.com");
  await page.getByLabel("Password", { exact: true }).fill("Password123!!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: DEMO_STATE });
});
