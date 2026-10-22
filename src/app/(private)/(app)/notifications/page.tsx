"use client";

import { Bell, CheckCheck, Trash2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Error from "@/components/Error";
import {
  useFetchNotificationList,
  useReadAllNotifications,
  useDeleteAllNotifications,
  NotificationList,
} from "@/features/notification";

export default function NotificationsPage() {
  const fetchList = useFetchNotificationList();
  const readAll = useReadAllNotifications();
  const deleteAll = useDeleteAllNotifications();

  if (fetchList.isError) {
    return <Error message={fetchList.error.message} />;
  }

  const items = fetchList.data?.data.data ?? [];
  const unreadItems = items.filter((n) => !n.read_at);
  const readItems = items.filter((n) => !!n.read_at);
  const unreadCount = unreadItems.length;

  return (
    <div className="page-container space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl flex flex-wrap items-center gap-2">
            <Bell size={22} className="text-primary" aria-hidden />
            Notifications
            {unreadCount > 0 && (
              <span className="border-outline bg-highlight text-highlight-foreground inline-flex items-center border-2 px-2 py-0.5 text-xs">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Realtime updates on exports, imports and your account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
            >
              <CheckCheck size={14} className="mr-1.5" />
              Mark all read
            </Button>
          )}
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteAll.mutate()}
              disabled={deleteAll.isPending}
            >
              <Trash2 size={14} className="mr-1.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-grid">
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadItems.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({readItems.length})</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {fetchList.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="all">
                <NotificationList notifications={items} />
              </TabsContent>
              <TabsContent value="unread">
                <NotificationList
                  notifications={unreadItems}
                  emptyTitle="Nothing unread"
                  emptyBody="You've read everything here. New updates will show up in this tab first."
                />
              </TabsContent>
              <TabsContent value="read">
                <NotificationList
                  notifications={readItems}
                  emptyTitle="Nothing read yet"
                  emptyBody="Notifications move here once you open or mark them as read."
                />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
