"use client";

import { Sprite } from "@/components/pixel/sprites";
import { motion, useReducedMotion } from "motion/react";

import { browserTimezone, formatDateTime } from "@/lib/utils/date";

import { NotificationItemType } from "../schema";
import { NotificationItem } from "./notification-item";

type Props = {
  notifications: NotificationItemType[];
  /** Each tab means something different by "empty", so each says so. */
  emptyTitle?: string;
  emptyBody?: string;
  /** Forwarded to each row so a container can close on navigation. */
  onNavigate?: () => void;
};

const DAY = 86_400_000;

/**
 * Buckets the feed by calendar day in the user's own timezone — the same zone
 * that decides what "today" means everywhere else in the app. Undated rows fall
 * into a trailing group rather than being dropped.
 */
function groupByDay(notifications: NotificationItemType[], timezone: string) {
  const today = formatDateTime(new Date(), "yyyy-MM-dd", timezone);
  const yesterday = formatDateTime(new Date(Date.now() - DAY), "yyyy-MM-dd", timezone);

  const groups: {
    key: string;
    label: string;
    items: { notification: NotificationItemType; position: number }[];
  }[] = [];

  for (const [position, notification] of notifications.entries()) {
    const key = notification.created_at
      ? formatDateTime(notification.created_at, "yyyy-MM-dd", timezone)
      : "undated";

    const label =
      key === today
        ? "Today"
        : key === yesterday
          ? "Yesterday"
          : key === "undated"
            ? "Earlier"
            : formatDateTime(notification.created_at, "MMMM d, yyyy", timezone);

    const last = groups.at(-1);
    if (last?.key === key) last.items.push({ notification, position });
    else groups.push({ key, label, items: [{ notification, position }] });
  }

  return groups;
}

export const NotificationList = ({
  notifications,
  emptyTitle = "No notifications",
  emptyBody = "You're all caught up. New updates on exports, imports and your account will appear here.",
  onNavigate,
}: Props) => {
  const timezone = browserTimezone();
  const reduceMotion = useReducedMotion();

  const groups = groupByDay(notifications, timezone);

  if (!notifications.length) {
    return (
      <div className="border-outline/40 flex flex-col items-center justify-center gap-4 border-2 border-dashed px-4 py-12 text-center">
        <Sprite name="mascot" size={40} />
        <div className="pixel-box bg-card max-w-sm px-4 py-3">
          <h3 className="text-base">{emptyTitle}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h2 className="mb-2 flex items-center gap-3 text-sm text-muted-foreground">
            {group.label}
            <span className="border-outline/40 h-0 flex-1 border-t-2 border-dashed" aria-hidden />
            <span className="tabular-nums font-normal">{group.items.length}</span>
          </h2>

          <div className="space-y-0.5">
            {group.items.map(({ notification, position }) => (
              <motion.div
                key={notification.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                  // 40ms apart reads as a cascade; capped so a full page of
                  // rows never leaves the last one waiting.
                  delay: Math.min(position * 0.04, 0.4),
                }}
              >
                <NotificationItem notification={notification} onNavigate={onNavigate} />
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
