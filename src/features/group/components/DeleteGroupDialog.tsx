"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiConflictError } from "@/lib/utils/request";

import { useCompleteGroup, useDeleteGroup } from "../hooks";
import type { GroupCard } from "../schema";

type DeleteGroupDialogProps = {
  group: GroupCard | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

/**
 * A group without expenses or settlements is deleted after one confirmation. One with history needs its
 * name typed back (the API checks it too), and "Mark completed" is offered as the safer choice.
 */
export function DeleteGroupDialog({ group, onOpenChange, onDeleted }: DeleteGroupDialogProps) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Settlements alone (no expenses left) are history too; the API says so with a 409.
  const [conflicted, setConflicted] = useState(false);
  const remove = useDeleteGroup();
  const complete = useCompleteGroup();

  const hasHistory = !!group && (group.expenses_count > 0 || conflicted);
  const close = (next: boolean) => {
    if (!next) {
      setTyped("");
      setError(null);
      setConflicted(false);
    }
    onOpenChange(next);
  };

  if (!group) return null;

  const run = (action: Promise<unknown>) =>
    action.then(
      () => close(false),
      (e: Error) => {
        if (e instanceof ApiConflictError) setConflicted(true);
        setError(e.message);
      }
    );

  return (
    <Dialog open={!!group} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{group.name}”?</DialogTitle>
          <DialogDescription>
            {hasHistory
              ? "This removes the group, its expenses and its settlements for good. Shares you recorded in your budget stay there as ordinary transactions. To keep the history, mark the group completed instead."
              : "This removes the group for good. You can't undo it."}
          </DialogDescription>
        </DialogHeader>

        {hasHistory && (
          <Field>
            <FieldLabel htmlFor="delete-group-name">
              Type the group&apos;s name to confirm
            </FieldLabel>
            <Input
              id="delete-group-name"
              value={typed}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
            />
          </Field>
        )}

        {error && (
          <p role="alert" className="text-expense text-sm">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          {hasHistory && group.status === "active" && (
            <Button
              variant="outline"
              disabled={complete.isPending}
              onClick={() => run(complete.mutateAsync({ id: group.id, complete: true }))}
            >
              Mark completed instead
            </Button>
          )}
          <Button
            variant="destructive"
            disabled={remove.isPending || (hasHistory && typed.trim() !== group.name)}
            onClick={() =>
              run(
                remove
                  .mutateAsync({ id: group.id, confirmName: hasHistory ? typed.trim() : undefined })
                  .then(() => onDeleted?.())
              )
            }
          >
            {remove.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
