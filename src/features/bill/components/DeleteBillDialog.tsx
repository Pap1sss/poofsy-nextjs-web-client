"use client";

import { useState } from "react";
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
import { ApiConflictError } from "@/lib/utils/request";

import { useDeleteBill, useSetBillActive } from "../hooks";
import type { Bill } from "../schema";

/**
 * Delete with the bill-specific way out: a bill with payments answers 409 "deactivate", so the
 * dialog switches to offering that (paid history stays) instead of a dead end.
 */
export function DeleteBillDialog({
  bill,
  onOpenChange,
}: {
  bill: Bill | null;
  onOpenChange: (open: boolean) => void;
}) {
  const remove = useDeleteBill();
  const setActive = useSetBillActive();
  const [conflict, setConflict] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setConflict(null);
    setError(null);
    onOpenChange(false);
  };

  const onDelete = () => {
    if (!bill) return;
    setError(null);
    remove.mutate(bill.id, {
      onSuccess: (res) => {
        toast.success(res.message);
        close();
      },
      onError: (e) =>
        e instanceof ApiConflictError && e.options.includes("deactivate")
          ? setConflict(e.message)
          : setError(e.message),
    });
  };

  const onDeactivate = () => {
    if (!bill) return;
    setActive.mutate(
      { id: bill.id, active: false },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          close();
        },
        onError: (e) => setError(e.message),
      }
    );
  };

  return (
    <Dialog open={!!bill} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {conflict ? `${bill?.name} has payments` : `Delete bill “${bill?.name}”?`}
          </DialogTitle>
          <DialogDescription>
            {conflict
              ? `${conflict} Deactivating stops reminders and future due dates; paid history stays.`
              : "This removes the bill and its upcoming due dates for good. You can't undo it."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="text-expense text-sm">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          {conflict ? (
            <Button disabled={setActive.isPending} onClick={onDeactivate}>
              {setActive.isPending ? "Deactivating..." : "Deactivate instead"}
            </Button>
          ) : (
            <Button variant="destructive" disabled={remove.isPending} onClick={onDelete}>
              {remove.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
