"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { routes } from "@/config/routes";

import { useFetchNotificationList, useReadAllNotifications } from "../hooks";
import { NotificationList } from "./notification-list";

export default function NotificationDropdown() {
  // Controlled so a row that navigates can close the menu behind it. Radix
  // only dismisses on an outside click, so a link inside the panel would
  // otherwise leave it open on top of the page it just opened.
  const [open, setOpen] = useState(false);
  const notifications = useFetchNotificationList();
  const readAll = useReadAllNotifications();

  const items = notifications.data?.data.data ?? [];
  const unreadItems = items.filter((n) => !n.read_at);
  const readItems = items.filter((n) => !!n.read_at);
  const unreadCount = notifications.data?.summary?.unread_count ?? unreadItems.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="border-outline bg-highlight text-highlight-foreground font-pixel absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center border-2 px-0.5 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <Tabs defaultValue="all" className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 gap-1">
              <TabsTrigger
                value="all"
                className="font-pixel rounded-none border-2 border-transparent px-2 py-1.5 text-sm data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none"
              >
                All ({items.length})
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="font-pixel rounded-none border-2 border-transparent px-2 py-1.5 text-sm data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none"
              >
                Unread ({unreadItems.length})
              </TabsTrigger>
              <TabsTrigger
                value="read"
                className="font-pixel rounded-none border-2 border-transparent px-2 py-1.5 text-sm data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none"
              >
                Read ({readItems.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-80 w-full">
            <div className="p-3">
              {notifications.isLoading ? (
                <div className="space-y-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="m-0">
                    <NotificationList notifications={items} onNavigate={() => setOpen(false)} />
                  </TabsContent>
                  <TabsContent value="unread" className="m-0">
                    <NotificationList
                      notifications={unreadItems}
                      onNavigate={() => setOpen(false)}
                    />
                  </TabsContent>
                  <TabsContent value="read" className="m-0">
                    <NotificationList notifications={readItems} onNavigate={() => setOpen(false)} />
                  </TabsContent>
                </>
              )}
            </div>
          </ScrollArea>
        </Tabs>

        <DropdownMenuSeparator className="m-0" />

        <div className="p-2">
          <Button variant="ghost" className="w-full text-sm text-muted-foreground" asChild>
            <Link href={routes.notifications.list} onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
