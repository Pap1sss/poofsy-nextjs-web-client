"use client";

import * as React from "react";
import { Loader, type LucideIcon } from "lucide-react";

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
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

interface ConfirmDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  title: string;
  description: string;
  isPending?: boolean;
  onConfirm: () => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerIcon?: LucideIcon;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  confirmLabel?: string;
  confirmVariant?: VariantProps<typeof buttonVariants>["variant"];
  cancelLabel?: string;
  /**
   * Makes the second button an action rather than a way out — for a choice
   * between two things to do, like save or discard, where neither is "cancel".
   * Omit it and the button only closes the dialog, as it always has.
   */
  onCancel?: () => void;
  cancelVariant?: VariantProps<typeof buttonVariants>["variant"];
}

export function ConfirmDialog({
  title,
  description,
  isPending = false,
  onConfirm,
  showTrigger = true,
  triggerLabel = "Open",
  triggerIcon: TriggerIcon,
  triggerVariant = "outline",
  confirmLabel = "Confirm",
  confirmVariant = "default",
  cancelLabel = "Cancel",
  onCancel,
  cancelVariant = "outline",
  ...props
}: ConfirmDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // With `onCancel` this is a second action, so it must not be wrapped in a
  // Close — the handler decides what happens, not the dialog.
  const cancelButton = onCancel ? (
    <Button variant={cancelVariant} onClick={onCancel} disabled={isPending}>
      {cancelLabel}
    </Button>
  ) : null;

  const triggerButton = (
    <Button variant={triggerVariant} size="sm">
      {TriggerIcon && <TriggerIcon className="mr-2 size-4" aria-hidden="true" />}
      {triggerLabel}
    </Button>
  );

  const confirmButton = (
    <Button
      aria-label={confirmLabel}
      variant={confirmVariant}
      onClick={onConfirm}
      disabled={isPending}
    >
      {isPending && <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />}
      {confirmLabel}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog {...props}>
        {showTrigger ? <DialogTrigger asChild>{triggerButton}</DialogTrigger> : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            {cancelButton ?? (
              <DialogClose asChild>
                <Button variant="outline">{cancelLabel}</Button>
              </DialogClose>
            )}
            {confirmButton}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      {showTrigger ? <DrawerTrigger asChild>{triggerButton}</DrawerTrigger> : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          {cancelButton ?? (
            <DrawerClose asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </DrawerClose>
          )}
          {confirmButton}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
