"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { segmentClass, segmentListClass } from "@/components/ui/segments";

export type ListStatus = "active" | "archived";

const STATUSES: { value: ListStatus; label: string }[] = [
  { value: "active", label: "In use" },
  { value: "archived", label: "Archived" },
];

/**
 * Switches a list between records in use and archived ones. A toggle group, not ARIA tabs:
 * there are no tab panels, just one list that changes.
 */
export function ListStatusTabs({
  value,
  onValueChange,
}: {
  value: ListStatus;
  onValueChange: (value: ListStatus) => void;
}) {
  return (
    <div role="group" aria-label="Show" className={segmentListClass}>
      {STATUSES.map((status) => (
        <button
          key={status.value}
          type="button"
          aria-pressed={value === status.value}
          onClick={() => onValueChange(status.value)}
          className={segmentClass}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}

export type RowAction = { label: string; onSelect: () => void; destructive?: boolean };

/** One overflow menu per row keeps rows calm and the touch target at 44px. */
export function RowActionsMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={label}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onSelect={action.onSelect}
            variant={action.destructive ? "destructive" : "default"}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
