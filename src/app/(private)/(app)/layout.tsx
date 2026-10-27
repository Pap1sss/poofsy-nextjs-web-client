import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSideBar";
import { MobileTabBar } from "@/components/dashboard/MobileTabBar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ModeToggle } from "@/lib/next-themes";
import NotificationDropdown from "@/features/notification/components/notification-dropdown";
import { CommandMenu } from "@/components/command-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        {/* The top strip of the screen: cream panel over a thick outline, like a handheld menu bar. */}
        <header
          data-print="hide"
          className="bg-card border-outline sticky top-0 z-10 mb-4 flex h-16 shrink-0 items-center gap-2 border-b-3 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-2 size-11 md:-ml-1 md:size-8" />
            <Breadcrumbs />
            <div className="ml-auto flex gap-1 items-center">
              <CommandMenu />
              <NotificationDropdown />
              <ModeToggle />
            </div>
          </div>
        </header>
        {/* Bottom padding on phones clears the tab bar (and the home indicator) below. */}
        <div className="flex flex-1 flex-col gap-4 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:py-6">
          {children}
        </div>
      </SidebarInset>
      <MobileTabBar />
    </SidebarProvider>
  );
}
