import { Bell, Shield, UserPlus, UserRound, type LucideIcon } from "lucide-react";

import { rolePermissions } from "@/features/role-and-permission";
import { userPermissions } from "@/features/user";

import { navigation, routes } from "./routes";

export type CommandLink = {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** Extra words the search should match, e.g. "add new" for a create action. */
  keywords?: string[];
  /** Any one of these unlocks the command (empty = every signed-in user). */
  permissions?: string[];
  /** Hidden until the user has finished onboarding (budgeting pages). */
  requiresOnboarding?: boolean;
};

type PageOverride = Partial<CommandLink> & Pick<CommandLink, "href">;

const navPages: CommandLink[] = navigation
  .filter((item) => item.url)
  .map((item) => ({
    id: `page:${item.url}`,
    // Budgeting pages read better by their own name ("Payday Planner", not "Payday Planner List").
    label: item.requiresOnboarding ? item.title : item.title + " List",
    href: item.url!,
    icon: item.icon,
    permissions: item.permissions,
    requiresOnboarding: item.requiresOnboarding,
  }));

// Extra pages, or overrides for a sidebar page (matched by href). An override
// keeps the sidebar's icon and permissions unless it sets its own.
const pageOverrides: PageOverride[] = [
  { href: routes.dashboard.home, label: "Home", keywords: ["dashboard"] },
  { href: routes.profile, label: "Profile", icon: UserRound, keywords: ["account", "password"] },
  { href: routes.notifications.list, label: "Notifications", icon: Bell, keywords: ["inbox"] },
  {
    href: routes.system_activities.list,
    label: "System Activities",
    keywords: ["audit", "log", "history"],
  },
  {
    href: routes.roles_and_permissions.list,
    label: "Roles and Permissions",
    keywords: ["access", "rbac"],
  },
];

export const commandPages: CommandLink[] = [
  ...navPages.map((page) => {
    const override = pageOverrides.find((o) => o.href === page.href);
    return override ? { ...page, ...override } : page;
  }),
  ...pageOverrides
    .filter((o) => !navPages.some((page) => page.href === o.href))
    .map((o) => ({ id: `page:${o.href}`, label: o.label ?? o.href, ...o })),
];

// Shortcuts to common actions. Add a module's "create" pages here.
export const commandActions: CommandLink[] = [
  {
    id: "action:create-user",
    label: "Create user",
    href: routes.users.create,
    icon: UserPlus,
    keywords: ["add", "new", "account"],
    permissions: [userPermissions.Create],
  },
  {
    id: "action:create-role",
    label: "Create role",
    href: routes.roles_and_permissions.create,
    icon: Shield,
    keywords: ["add", "new", "permissions"],
    permissions: [rolePermissions.Create],
  },
];
