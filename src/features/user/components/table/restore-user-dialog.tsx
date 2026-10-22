"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { UserListItem } from "../../schema";
import { useRestoreUser } from "../../hooks";

interface RestoreUserDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  user: Row<UserListItem>["original"] | null;
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function RestoreUserDialog({
  user,
  showTrigger = true,
  onSuccess,
  ...props
}: RestoreUserDialogProps) {
  const restoreUser = useRestoreUser(user?.id ?? "");

  const onRestore = () => {
    if (!user) {
      toast.error("No User selected");
      return;
    }

    restoreUser.mutate(undefined, {
      onSuccess: ({ message }) => {
        props.onOpenChange?.(false);
        toast.success(message);
        onSuccess?.();
      },
      onError: ({ message }) => {
        toast.error(message);
      },
    });
  };

  return (
    <ConfirmDialog
      {...props}
      title="Restore User?"
      description={`This will restore "${user?.profile.full_name}" and make it active again.`}
      onConfirm={onRestore}
      isPending={restoreUser.isPending}
      showTrigger={showTrigger}
      triggerLabel="Restore"
      triggerIcon={RotateCcw}
      confirmLabel="Restore"
    />
  );
}
