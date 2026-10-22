"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NavItem } from "@/config/routes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type SidebarNavGroup = {
  items: NavItem[];
  groupName: string;
};

export default function SidebarNavGroup({ items, groupName }: SidebarNavGroup) {
  "use no memo";
  const pathname = usePathname();

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item, i) => {
      if (!item.items?.length) return;
      const key = `${i}-${item.title}`;
      initial[key] = item.items.some((sub) => sub.url && pathname.startsWith(sub.url));
    });
    return initial;
  });

  // Auto-open parent when navigating into a sub-item
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenMap((prev) => {
      const next = { ...prev };
      let changed = false;
      items.forEach((item, i) => {
        if (!item.items?.length) return;
        const key = `${i}-${item.title}`;
        const hasActive = item.items.some((sub) => sub.url && pathname.startsWith(sub.url));
        if (hasActive && !prev[key]) {
          next[key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [pathname, items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          const key = `${index}-${item.title}`;
          const isOpen = openMap[key] ?? false;

          const hasActiveSubItem = item.items?.some(
            (subItem) => subItem.url && pathname.startsWith(subItem.url)
          );

          const isActive =
            hasActiveSubItem ||
            (item.url ? pathname === item.url || pathname.startsWith(item.url + "/") : false);

          const toggle = () => setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));

          return (
            <Collapsible
              key={key}
              asChild
              open={item.items?.length ? isOpen : undefined}
              onOpenChange={
                item.items?.length
                  ? (v) => setOpenMap((prev) => ({ ...prev, [key]: v }))
                  : undefined
              }
            >
              <SidebarMenuItem>
                {item.items?.length ? (
                  item.url ? (
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton isActive={isActive} onClick={toggle}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )
                ) : (
                  <SidebarMenuButton asChild isActive={isActive}>
                    {item.url ? (
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <div>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                )}

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRightIcon />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubItemActive = subItem.url
                            ? pathname === subItem.url || pathname.startsWith(subItem.url + "/")
                            : false;

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                {subItem.url ? (
                                  <Link href={subItem.url}>{subItem.title}</Link>
                                ) : (
                                  <span>{subItem.title}</span>
                                )}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
