"use client";

import {
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Download,
  MoreHorizontal,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import { cn } from "@/lib/utils/component";
import { browserTimezone, formatDateTime } from "@/lib/utils/date";

import { NotificationItemType } from "../schema";
import { useDeleteNotification, useReadNotification } from "../hooks";

type Props = {
  notification: NotificationItemType;
  /** Lets a container close itself when the row navigates, e.g. the dropdown. */
  onNavigate?: () => void;
};

/**
 * One colour in the list, on purpose. Unread is a primary-coloured dot on the right and
 * nothing else is tinted — severity used to drive the hue, which turned a feed
 * of ordinary reminders into something that read as a warning panel.
 *
 * Read items dim rather than changing shape, so the eye sorts the list by weight
 * instead of by counting dots.
 *
 * The trade is deliberate and worth knowing: a failed import no longer looks
 * different from a successful one at a glance. The Completed/Failed chip below
 * is the only thing separating them, so it is load-bearing, not decoration.
 */
const TILE = "bg-muted text-muted-foreground";
const CHIP = "bg-muted text-muted-foreground";

/** Glyphs a notification may ask for by name via `data.icon`. */
const KIND_ICON = {
  export: Download,
  import: Upload,
  bell: Bell,
  alert: CircleAlert,
  clock: Clock,
  calendar: CalendarClock,
  users: Users,
} as const;

export const NotificationItem = ({ notification, onNavigate }: Props) => {
  const readNotification = useReadNotification();
  const deleteNotification = useDeleteNotification();
  const timezone = browserTimezone();
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isRead = !!notification.read_at;

  // In practice the backend sends only `message`, so the old `title !== body`
  // guard meant the body line never rendered. Fall back once instead of twice.
  const title = notification.data?.title ?? notification.data?.message ?? "Notification";
  const body = notification.data?.body ?? null;

  // Emphasis has to be told, not guessed: only the server knows which run of the
  // sentence names the thing. Anything that sends no segments reads as one plain
  // run, which is what the import/export notifications have always done.
  const segments = notification.data?.segments?.length
    ? notification.data.segments
    : [{ text: title, bold: false }];

  // `icon` is the explicit choice; `type` is how the import/export notifications
  // named their glyph before there was one, and still resolves for them.
  const kind = notification.data?.icon ?? notification.data?.type;
  const KindIcon = (kind && KIND_ICON[kind as keyof typeof KIND_ICON]) || Bell;
  const downloadLink = notification.data?.data?.download_link;

  // Only the import/export notifications report an outcome, and with the hue
  // gone this chip is all that separates a failed one from a successful one.
  // Everything else says what it needs to in the title and shows no chip.
  const outcome = notification.data?.success;
  const statusLabel = outcome === true ? "Completed" : outcome === false ? "Failed" : null;

  const detailData = notification.data?.data;
  const errors = detailData?.errors ?? [];
  const duplicates = detailData?.duplicates ?? [];
  const hasDetails = !!detailData?.stats || errors.length > 0 || duplicates.length > 0;

  const markRead = () => readNotification.mutate(notification.id);

  // Only ever an in-app path. The value comes from the server, and refusing
  // anything that is not root-relative keeps a stored payload from turning a
  // notification row into an off-site link.
  const href = notification.data?.link?.startsWith("/") ? notification.data.link : null;

  const handleNavigate = () => {
    if (!isRead) markRead();
    onNavigate?.();
  };

  return (
    <>
      <DeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        itemCount={1}
        itemName="notification"
        description="This will permanently delete this notification."
        isPending={deleteNotification.isPending}
        onDelete={() =>
          deleteNotification.mutate(notification.id, {
            onSuccess: () => setConfirmDelete(false),
          })
        }
        showTrigger={false}
      />

      <article
        className={cn(
          "group relative flex items-start gap-3 border-2 border-transparent p-2.5",
          // Only offer the hover when the row actually goes somewhere.
          href && "hover:border-outline hover:bg-accent/60"
        )}
      >
        {/* Stretched link rather than a wrapper: the row already contains a
            menu button, and sometimes a download button, and a button inside
            an anchor is invalid markup that would navigate on every click.
            The controls below sit above this layer in z-order. */}
        {href && (
          <Link
            href={href}
            onClick={handleNavigate}
            className="focus-visible:outline-highlight absolute inset-0 z-0 outline-none focus-visible:outline-3"
            aria-label={title}
          />
        )}

        <span
          className={cn("pixel-box mt-0.5 grid size-9 shrink-0 place-items-center", TILE)}
          aria-hidden
        >
          <KindIcon size={16} />
        </span>

        <div className="min-w-0 flex-1">
          {/* One block, truncated rather than allowed to run: a feed is scanned,
              not read, and a notification that needs more than two lines has the
              wrong sentence. Read items dim; unread keep full contrast. */}
          <p
            className={cn(
              "line-clamp-2 text-sm leading-snug",
              isRead ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {segments.map((segment, i) => (
              <span key={i} className={cn(segment.bold && "font-semibold")}>
                {segment.text}
              </span>
            ))}
            {!isRead && <span className="sr-only"> (unread)</span>}
          </p>

          {body && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>}

          {notification.created_at && (
            <time
              dateTime={notification.created_at}
              title={formatDateTime(notification.created_at, "MMM d, yyyy h:mm a", timezone)}
              className="mt-0.5 block text-xs tabular-nums text-muted-foreground"
            >
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </time>
          )}

          {(statusLabel || downloadLink || hasDetails) && (
            <div className="relative z-10 mt-2 flex items-center gap-2 w-fit">
              {/* Carries the meaning the hue used to, for outcomes only. */}
              {statusLabel && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    CHIP
                  )}
                >
                  {outcome === false && <CircleAlert size={11} />}
                  {statusLabel}
                </span>
              )}

              {downloadLink && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    if (!isRead) markRead();
                    window.open(`/api${downloadLink}`, "_blank");
                  }}
                >
                  <Download size={12} />
                  Download
                </Button>
              )}

              {hasDetails && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded((v) => !v)}
                  aria-expanded={isExpanded}
                >
                  Details
                  <ChevronDown
                    size={12}
                    className={cn("transition-transform", isExpanded && "rotate-180")}
                  />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1 self-center">
          {!isRead && (
            <span className="border-outline bg-highlight size-3 shrink-0 border-2" aria-hidden />
          )}

          {/* Hidden until the row is hovered, so the resting list is text only.
              Kept visible on touch, where there is no hover to reveal it, and on
              keyboard focus and while open — an action reachable by Tab but
              invisible is worse than one that is always shown. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "touch-target text-muted-foreground transition-opacity",
                  "md:size-7 md:opacity-0 md:group-hover:opacity-100",
                  "md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
                )}
                aria-label="More actions"
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isRead && (
                <DropdownMenuItem onClick={markRead}>
                  <Check size={14} />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasDetails && isExpanded && (
          <div className="border-outline relative z-10 border-t-2 border-dashed bg-muted/30 p-3 pl-4">
            {detailData?.stats && (
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["Created", detailData.stats.created, ""],
                    ["Skipped", detailData.stats.total_skipped, ""],
                    ["Duplicates", detailData.stats.duplicates_count, ""],
                    [
                      "Errors",
                      detailData.stats.errors_count,
                      detailData.stats.errors_count > 0 ? "text-expense" : "",
                    ],
                  ] as const
                ).map(([label, value, accent]) => (
                  <div key={label} className="pixel-box bg-card px-2.5 py-2">
                    <dt className="font-pixel text-xs text-muted-foreground">{label}</dt>
                    <dd className={cn("mt-0.5 text-base font-semibold tabular-nums", accent)}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {errors.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Errors ({errors.length})
                </p>
                <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto">
                  {errors.map((error, i) => (
                    <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {duplicates.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Duplicates ({duplicates.length})
                </p>
                <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto">
                  {duplicates.map((dup, i) => (
                    <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                      • {typeof dup === "string" ? dup : JSON.stringify(dup)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </article>
    </>
  );
};
