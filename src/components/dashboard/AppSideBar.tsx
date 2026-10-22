"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import SidebarNavGroup from "@/components/dashboard/sidebar-nav-group";
import NavUser from "@/components/dashboard/NavUser";
import { NAV_GROUP, navigation, type NavItem } from "@/config/routes";
import { filterNavByPermissions } from "@/lib/utils/nav";
import { useAuth } from "@/features/auth/hooks";

import NavBrand from "./NavBrand";

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: auth } = useAuth();
  const userPermissions = auth?.data?.permissions || [];
  const userRoles = auth?.data?.roles || [];
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  // Close the mobile sheet after navigation (keyed on pathname so expanding a group doesn't).
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const filteredNav = filterNavByPermissions(
    navigation,
    userPermissions,
    userRoles,
    auth?.data?.onboarded ?? false
  );

  const groupedNav = filteredNav.reduce(
    (acc, item) => {
      const group = item.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavBrand />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {NAV_GROUP.options.map((item, index) => {
          const key = `${index}-${item}`;
          const items = groupedNav[item];

          if (!items || items.length === 0) return null;

          return <SidebarNavGroup items={items} key={key} groupName={item} />;
        })}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ email: auth?.data?.email, name: auth?.data?.name }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
