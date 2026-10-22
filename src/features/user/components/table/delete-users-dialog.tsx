"use client";

import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useBulkDeleteUsers, useDeleteUser } from "../../hooks";
import { UserListItem } from "../../schema";

interface DeleteUsersDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  users: Row<UserListItem>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteUsersDialog({
  users,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteUsersDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { mutate: deleteUser, isPending: isDeletingOne } = useDeleteUser();
  const { mutate: bulkDeleteUsers, isPending: isDeletingMany } = useBulkDeleteUsers();

  const isPending = isDeletingOne || isDeletingMany;

  const onDelete = () => {
    if (!users?.[0]?.id) {
      toast.error("No user selected");
      return;
    }

    const handlers = {
      onSuccess: ({ message }: { message: string }) => {
        props.onOpenChange?.(false);
        toast.success(message);
        onSuccess?.();
      },
      onError: ({ message }: { message: string }) => {
        toast.error(message);
      },
    };

    // Keep the single-record endpoint for one row so its response and activity
    // log stay identical to the row action; only fan out when there's a real
    // selection.
    if (users.length === 1) {
      deleteUser(users[0].id, handlers);
      return;
    }

    bulkDeleteUsers(
      users.map((user) => user.id),
      handlers
    );
  };

  if (isDesktop) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              Delete ({users.length})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will remove{" "}
              <span className="font-medium">{users.length}</span>
              {users.length === 1 ? " user" : " users"} from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              aria-label="Delete selected rows"
              variant="destructive"
              onClick={onDelete}
              disabled={isPending}
            >
              {isPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      {showTrigger ? (
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash className="mr-2 size-4" aria-hidden="true" />
            Delete ({users.length})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>
            This action cannot be undone. This will permanently delete your{" "}
            <span className="font-medium">{users.length}</span>
            {users.length === 1 ? " task" : " users"} from our servers.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
          >
            {isPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
            Delete
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
