"use client";

import * as React from "react";
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

interface DeleteDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  itemCount: number;
  itemName: string;
  isPending: boolean;
  onDelete: () => void;
  showTrigger?: boolean;
  title?: string;
  description?: string;
  /**
   * Extra content between the description and the buttons — for a choice the
   * delete depends on, e.g. whether to remove a linked record along with it.
   */
  children?: React.ReactNode;
}

export function DeleteDialog({
  itemCount,
  itemName,
  isPending,
  onDelete,
  showTrigger = true,
  title = "Are you absolutely sure?",
  description,
  children,
  ...props
}: DeleteDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const itemLabel = itemCount === 1 ? itemName : `${itemName}s`;
  const defaultDescription = `This action cannot be undone. This will remove ${itemCount} ${itemLabel} from the system.`;

  if (isDesktop) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              Delete ({itemCount})
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description ?? defaultDescription}</DialogDescription>
          </DialogHeader>
          {children}
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
            Delete ({itemCount})
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description ?? defaultDescription}</DrawerDescription>
        </DrawerHeader>
        {children ? <div className="px-4">{children}</div> : null}
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
