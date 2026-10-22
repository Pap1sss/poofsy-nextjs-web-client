import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Load routes before anything that imports it back (routes -> features -> auth -> AuthShell -> routes).
import { navigation, type NavItem } from "@/config/routes";
import { CommandMenu } from "@/components/command-menu";
import { filterNavByPermissions } from "@/lib/utils/nav";

import { onboardedAuth } from "./fixtures";
import { renderWithProviders } from "./render";

const titles = (items: NavItem[]) => items.map((item) => item.title);

const BUDGETING = [
  "Payday Planner",
  "Transactions",
  "Income",
  "Accounts & Wallets",
  "Savings Goals",
  "Bills",
  "Calendar",
  "Reports",
  "Categories",
  "Budget Templates",
  "Pay Schedule",
  "Settings",
];

describe("filterNavByPermissions", () => {
  it("shows every budgeting page to an onboarded user, and no admin pages", () => {
    const items = titles(filterNavByPermissions(navigation, [], ["user"], true));

    expect(items).toEqual(expect.arrayContaining(["Home", ...BUDGETING]));
    expect(items).not.toContain("Users");
    expect(items).not.toContain("Roles and Permissions");
  });

  it("hides budgeting pages until onboarding is done", () => {
    const items = titles(filterNavByPermissions(navigation, [], ["user"], false));

    expect(items).toEqual(["Home"]);
  });

  it("gives a super-admin who skipped onboarding the admin pages but no budgeting pages", () => {
    const items = titles(filterNavByPermissions(navigation, [], ["super-admin"], false));

    expect(items).toEqual(
      expect.arrayContaining(["Home", "Users", "System Activities", "Roles and Permissions"])
    );
    for (const page of BUDGETING) expect(items).not.toContain(page);
  });

  it("marks every budgeting page as needing onboarding", () => {
    const budgeting = navigation.filter((item) => BUDGETING.includes(item.title));

    expect(budgeting).toHaveLength(BUDGETING.length);
    expect(budgeting.every((item) => item.requiresOnboarding)).toBe(true);
  });
});

describe("command menu", () => {
  const openMenu = async (auth: ReturnType<typeof onboardedAuth>) => {
    const view = renderWithProviders(<CommandMenu />, { auth });
    await view.user.keyboard("{Control>}k{/Control}");
    return within(await screen.findByRole("dialog"));
  };

  it("lists budgeting pages by their own names for an onboarded user", async () => {
    const menu = await openMenu(onboardedAuth());

    expect(menu.getByText("Payday Planner")).toBeInTheDocument();
    expect(menu.getByText("Transactions")).toBeInTheDocument();
    expect(menu.queryByText("Payday Planner List")).not.toBeInTheDocument();
  });

  it("hides budgeting commands from a super-admin who hasn't onboarded", async () => {
    const menu = await openMenu(
      onboardedAuth({ roles: ["super-admin"], onboarded: false, settings: null })
    );

    expect(menu.getByText("Users List")).toBeInTheDocument();
    expect(menu.queryByText("Payday Planner")).not.toBeInTheDocument();
    expect(menu.queryByText("Transactions")).not.toBeInTheDocument();
  });
});
