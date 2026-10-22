"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";

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
import { Button } from "@/components/ui/button";

import { useBulkDeleteRoles, useDeleteRole } from "../../hooks";
import { RoleSchema } from "../../schema";

interface ForceDeleteRoleDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  roles: Row<RoleSchema>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function ForceDeleteRoleDialog({
  roles,
  showTrigger = true,
  onSuccess,
  ...props
}: ForceDeleteRoleDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const deleteRole = useDeleteRole();
  const bulkDeleteRoles = useBulkDeleteRoles();

  const isPending = deleteRole.isPending || bulkDeleteRoles.isPending;

  const onDelete = () => {
    if (!roles?.[0]?.id) {
      toast.error("No role selected");
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

    // Single row keeps the original endpoint so its response and activity log
    // match the row action exactly; only fan out for a real selection.
    if (roles.length === 1) {
      deleteRole.mutate(roles[0].id, handlers);
      return;
    }

    bulkDeleteRoles.mutate(
      roles.map((role) => role.id),
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
              Delete ({roles.length})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove{" "}
              <span className="font-medium">{roles.length}</span>
              {roles.length === 1 ? " role" : " roles"} from the system.
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
            Delete ({roles.length})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>
            This action cannot be undone. This will permanently delete your{" "}
            <span className="font-medium">{roles.length}</span>
            {roles.length === 1 ? " task" : " roles"} from our servers.
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
