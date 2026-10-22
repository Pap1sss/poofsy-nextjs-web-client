"use client";

import * as React from "react";
import type { Row } from "@tanstack/react-table";
import { Loader, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import { RoleComboboxMulti } from "@/features/role-and-permission";

import { useBulkSyncUserRoles } from "../../hooks";
import { UserListItem } from "../../schema";

interface BulkUserRolesDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  users: Row<UserListItem>["original"][];
  mode: "assign" | "remove";
  onSuccess?: () => void;
}

export function BulkUserRolesDialog({
  users,
  mode,
  onSuccess,
  ...props
}: BulkUserRolesDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [roles, setRoles] = React.useState<string[]>([]);
  const { mutate: syncRoles, isPending } = useBulkSyncUserRoles();

  const verb = mode === "remove" ? "Remove" : "Assign";

  const onSubmit = () => {
    if (roles.length === 0) {
      toast.error("Select at least one role");
      return;
    }

    syncRoles(
      { ids: users.map((user) => user.id), roles, mode },
      {
        onSuccess: ({ message }) => {
          props.onOpenChange?.(false);
          setRoles([]);
          toast.success(message);
          onSuccess?.();
        },
        onError: ({ message }) => toast.error(message),
      }
    );
  };

  const title = `${verb} roles`;
  const description = `${verb} the selected roles ${mode === "remove" ? "from" : "to"} ${users.length} user(s). Users already in the target state are left unchanged.`;

  const body = (
    <div className="grid gap-2 px-4 sm:px-0">
      <Label htmlFor="bulk-roles">Roles</Label>
      <RoleComboboxMulti onChange={setRoles} disabled={isPending} />
    </div>
  );

  const actions = (
    <>
      <Button variant="outline" disabled={isPending} onClick={() => props.onOpenChange?.(false)}>
        Cancel
      </Button>
      <Button
        variant={mode === "remove" ? "destructive" : "default"}
        disabled={isPending || roles.length === 0}
        onClick={onSubmit}
      >
        {isPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
        {verb}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog {...props}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldPlus className="size-4" aria-hidden="true" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {body}
          {/* Not wrapped in DialogClose — that would dismiss the dialog on the
              submit click before the mutation ever fired. */}
          <DialogFooter className="gap-2 sm:space-x-0">{actions}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {body}
        <DrawerFooter className="gap-2 sm:space-x-0">{actions}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
