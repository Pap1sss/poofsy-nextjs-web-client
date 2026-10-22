"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiConflictError, type ConflictOption } from "@/lib/utils/request";

type DeleteRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What's being deleted, as the user knows it: "Food", "GCash". */
  name: string;
  /** The kind of record, lower case: "category", "account". */
  noun: string;
  onDelete: () => Promise<unknown>;
  /** Offered when the API says the record is in use and can be archived instead. */
  onArchive?: () => Promise<unknown>;
  /** Offered when the API allows merging; the caller opens its own merge picker. */
  onMerge?: () => void;
};

/**
 * Delete with a way out (plan §6.1): a record that history still points at can't be deleted,
 * so a 409 turns this dialog into "archive or merge instead" rather than a dead-end error.
 */
export function DeleteRecordDialog({
  open,
  onOpenChange,
  name,
  noun,
  onDelete,
  onArchive,
  onMerge,
}: DeleteRecordDialogProps) {
  const [pending, setPending] = React.useState<"delete" | "archive" | null>(null);
  const [conflict, setConflict] = React.useState<{
    message: string;
    options: ConflictOption[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const reset = (next: boolean) => {
    if (!next) {
      setConflict(null);
      setError(null);
    }
    onOpenChange(next);
  };

  const run = async (kind: "delete" | "archive", action: () => Promise<unknown>) => {
    setPending(kind);
    setError(null);
    try {
      await action();
      reset(false);
    } catch (e) {
      if (kind === "delete" && e instanceof ApiConflictError) {
        setConflict({ message: e.message, options: e.options });
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setPending(null);
    }
  };

  const canArchive = !!onArchive && !!conflict?.options.includes("archive");
  const canMerge = !!onMerge && !!conflict?.options.includes("merge");

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {conflict ? `${name} is still in use` : `Delete ${noun} “${name}”?`}
          </DialogTitle>
          <DialogDescription>
            {conflict ? conflict.message : `This removes the ${noun} for good. You can't undo it.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-expense text-sm">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => reset(false)}>
            Cancel
          </Button>
          {!conflict && (
            <Button
              variant="destructive"
              disabled={!!pending}
              onClick={() => run("delete", onDelete)}
            >
              {pending === "delete" ? "Deleting..." : "Delete"}
            </Button>
          )}
          {canMerge && (
            <Button
              variant="outline"
              onClick={() => {
                reset(false);
                onMerge?.();
              }}
            >
              Merge into another
            </Button>
          )}
          {canArchive && (
            <Button disabled={!!pending} onClick={() => run("archive", onArchive!)}>
              {pending === "archive" ? "Archiving..." : "Archive instead"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
