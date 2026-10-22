"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Autocomplete } from "@/components/shared/autocomplete";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

import { useMergeCategory } from "../hooks";
import { CATEGORY_KIND_LABELS, type Category } from "../schema";

type MergeCategoryDialogProps = {
  source: Category | null;
  /** Active categories; only those of the same kind are offered. */
  categories: Category[];
  onOpenChange: (open: boolean) => void;
};

export function MergeCategoryDialog({
  source,
  categories,
  onOpenChange,
}: MergeCategoryDialogProps) {
  const merge = useMergeCategory();
  const [targetId, setTargetId] = useState("");

  const targets = categories.filter((c) => source && c.kind === source.kind && c.id !== source.id);

  const close = (open: boolean) => {
    if (!open) {
      setTargetId("");
      merge.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={!!source} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Merge “{source?.name}”</DialogTitle>
          <DialogDescription>
            Its transactions, budget allocations and bills move to the category you pick, and totals
            stay the same. Then “{source?.name}” is removed.
          </DialogDescription>
        </DialogHeader>

        {targets.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            There&apos;s no other {source ? CATEGORY_KIND_LABELS[source.kind].toLowerCase() : ""}{" "}
            category to merge into. Archive it instead, or add another category first.
          </p>
        ) : (
          <Field>
            <FieldLabel htmlFor="merge-target">Merge into</FieldLabel>
            <Autocomplete
              id="merge-target"
              value={targetId}
              onChange={setTargetId}
              options={targets.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
              placeholder="Choose a category"
              emptyMessage="No categories match."
              required
            />
          </Field>
        )}

        {merge.isError && (
          <Alert variant="destructive">
            <AlertDescription>{merge.error.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            disabled={!targetId || merge.isPending}
            onClick={() =>
              source &&
              merge.mutate(
                { id: source.id, targetId },
                {
                  onSuccess: (res) => {
                    toast.success(res.message);
                    close(false);
                  },
                }
              )
            }
          >
            {merge.isPending ? "Merging..." : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
