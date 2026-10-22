"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";

import { Dialog } from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/delete-dialog";

import { UserListItem } from "../../schema";
import { useBulkForceDeleteUsers } from "../../hooks";

interface ForceDeleteUserDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  users: Row<UserListItem>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function ForceDeleteUserDialog({
  users,
  showTrigger = true,
  onSuccess,
  ...props
}: ForceDeleteUserDialogProps) {
  // There is no single force-delete endpoint — DELETE /users/{user} is a soft
  // delete — so the bulk route handles one row just as well as many.
  const forceDeleteUsers = useBulkForceDeleteUsers();

  const onDelete = () => {
    if (users.length === 0) {
      toast.error("No user selected");
      return;
    }

    forceDeleteUsers.mutate(
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

  return (
    <DeleteDialog
      itemCount={users.length}
      itemName="user"
      description={`This action cannot be undone. This will permanently erase ${users.length} ${users.length > 1 ? "users" : "user"} and all their data.`}
      isPending={forceDeleteUsers.isPending}
      onDelete={onDelete}
      showTrigger={showTrigger}
      {...props}
    />
  );
}
