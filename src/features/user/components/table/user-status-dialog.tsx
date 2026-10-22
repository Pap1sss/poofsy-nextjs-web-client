"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserCheck, UserX } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

import type { UserStatusAction } from "../../api";
import { UserListItem } from "../../schema";
import { useSetUserStatus } from "../../hooks";

interface UserStatusDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  action: UserStatusAction;
  users: UserListItem[];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

/** Confirms deactivating or reactivating one user (row action, detail page) or a selection. */
export function UserStatusDialog({
  action,
  users,
  showTrigger = true,
  onSuccess,
  ...props
}: UserStatusDialogProps) {
  const setStatus = useSetUserStatus();

  // With its own trigger (detail page) nobody passes `open`, so track it here to close on success.
  const [internalOpen, setInternalOpen] = React.useState(false);
  const controlled = props.open !== undefined;
  const open = controlled ? props.open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const onConfirm = () => {
    if (users.length === 0) {
      toast.error("No user selected");
      return;
    }

    setStatus.mutate(
      { ids: users.map((user) => user.id), action },
      {
        onSuccess: ({ message }) => {
          setOpen(false);
          toast.success(message);
          onSuccess?.();
        },
        onError: ({ message }) => {
          toast.error(message);
        },
      }
    );
  };

  const subject =
    users.length === 1
      ? users[0].profile.full_name || users[0].display_name
      : `${users.length} users`;
  const deactivating = action === "deactivate";

  return (
    <ConfirmDialog
      {...props}
      open={open}
      onOpenChange={setOpen}
      title={deactivating ? `Deactivate ${subject}?` : `Reactivate ${subject}?`}
      description={
        deactivating
          ? "They'll be signed out everywhere right away and can't sign in until reactivated. Their data and roles are kept."
          : "They'll be able to sign in again with their existing password, roles and data."
      }
      onConfirm={onConfirm}
      isPending={setStatus.isPending}
      showTrigger={showTrigger}
      triggerLabel={deactivating ? "Deactivate" : "Reactivate"}
      triggerIcon={deactivating ? UserX : UserCheck}
      triggerVariant="outline"
      confirmLabel={deactivating ? "Deactivate" : "Reactivate"}
      confirmVariant={deactivating ? "destructive" : "default"}
    />
  );
}
