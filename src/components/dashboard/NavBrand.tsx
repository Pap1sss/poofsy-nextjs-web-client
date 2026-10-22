"use client";

import Link from "next/link";

import AppLogo from "@/components/app-logo";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { config } from "@/config";
import { routes } from "@/config/routes";

/** The brand row is one link home, so it works from the keyboard as well as by click. */
export default function NavBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
        >
          <Link href={routes.home}>
            <AppLogo className="size-8" />
            <span className="grid flex-1 text-left leading-tight">
              <span className="font-display truncate text-sm">{config.app.name}</span>
              <span className="text-muted-foreground truncate font-sans text-xs">
                {config.app.description}
              </span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
