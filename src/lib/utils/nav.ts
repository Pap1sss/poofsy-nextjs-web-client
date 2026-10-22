import type { NavItem } from "@/config/routes";

const SUPER_ADMIN = "super-admin";

/** Any-of permission check that mirrors PermissionGate, including the super-admin bypass. */
export function canAccess(
  required: string[] | undefined,
  permissions: string[],
  roles: string[] = []
): boolean {
  if (roles.includes(SUPER_ADMIN)) return true;

  return !required || required.length === 0 || required.some((p) => permissions.includes(p));
}

/** Nav entries the user may see. Budgeting entries wait for onboarding (see NavItem.requiresOnboarding). */
export function filterNavByPermissions(
  navItems: NavItem[],
  permissions: string[],
  roles: string[] = [],
  onboarded = true
): NavItem[] {
  return navItems
    .filter((item) => onboarded || !item.requiresOnboarding)
    .filter((item) => canAccess(item.permissions, permissions, roles))
    .map((item) =>
      item.items?.length
        ? {
            ...item,
            items: item.items.filter((sub) => canAccess(sub.permissions, permissions, roles)),
          }
        : item
    );
}
