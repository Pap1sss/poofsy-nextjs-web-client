"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { UserListItem } from "../../schema";
import { useBulkRestoreUsers } from "../../hooks";

interface BulkRestoreUsersDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  users: Row<UserListItem>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

/**
 * Selection-aware sibling of RestoreUserDialog, which handles a single row for
 * the row action. Restore is rejected outright unless every selected user is in
 * the trash, so the copy names the count rather than one person.
 */
export function BulkRestoreUsersDialog({
  users,
  showTrigger = true,
  onSuccess,
  ...props
}: BulkRestoreUsersDialogProps) {
  const restoreUsers = useBulkRestoreUsers();

  const onRestore = () => {
    if (users.length === 0) {
      toast.error("No user selected");
      return;
    }

    restoreUsers.mutate(
      users.map((user) => user.id),
      {
        onSuccess: ({ message }) => {
          props.onOpenChange?.(false);
          toast.success(message);
          onSuccess?.();
        },
        onError: ({ message }) => {
          toast.error(message);
        },
      }
    );
  };

  const label = users.length === 1 ? "user" : "users";

  return (
    <ConfirmDialog
      {...props}
      title={`Restore ${users.length} ${label}?`}
      description={`This will bring ${users.length} ${label} out of the trash and make them active again.`}
      onConfirm={onRestore}
      isPending={restoreUsers.isPending}
      showTrigger={showTrigger}
      triggerLabel="Restore"
      triggerIcon={RotateCcw}
      confirmLabel="Restore"
    />
  );
}
