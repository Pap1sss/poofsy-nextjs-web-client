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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUserSettings } from "@/features/auth";
import { todayIn } from "@/lib/utils/date";
import { ApiConflictError, ApiValidationError } from "@/lib/utils/request";

import { useDeleteIncomeSource, useEndIncomeSource } from "../hooks";
import type { IncomeSource } from "../schema";

/**
 * Delete, or end-date when income was already recorded from it (the API answers 409 with
 * option "end_date"). DeleteRecordDialog only knows archive and merge, so this flow is local.
 */
export function DeleteSourceDialog({
  source,
  onOpenChange,
}: {
  source: IncomeSource | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {source && <Body key={source.id} source={source} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ source, onDone }: { source: IncomeSource; onDone: () => void }) {
  const { timezone } = useUserSettings();
  const remove = useDeleteIncomeSource();
  const end = useEndIncomeSource();
  const [conflict, setConflict] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(todayIn(timezone));
  const [error, setError] = useState<string | null>(null);

  const onDelete = () =>
    remove.mutate(source.id, {
      onSuccess: (res) => {
        toast.success(res.message);
        onDone();
      },
      onError: (e) => {
        if (e instanceof ApiConflictError && e.options.includes("end_date")) setConflict(e.message);
        else setError(e.message);
      },
    });

  const onEnd = () =>
    end.mutate(
      { id: source.id, effectiveFrom: source.effective_from, effectiveTo: endDate },
      {
        onSuccess: () => {
          toast.success(`${source.name} ends on ${endDate}. Its past income stays as it is.`);
          onDone();
        },
        onError: (e) =>
          setError(
            e instanceof ApiValidationError
              ? (Object.values(e.errors)[0]?.[0] ?? e.message)
              : e.message
          ),
      }
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {conflict ? `End ${source.name} instead?` : `Delete “${source.name}”?`}
        </DialogTitle>
        <DialogDescription>
          {conflict ?? "This removes the income source for good. You can't undo it."}
        </DialogDescription>
      </DialogHeader>

      {conflict && (
        <Field className="max-w-60">
          <FieldLabel htmlFor="source-end-date">Last day of this income</FieldLabel>
          <Input
            id="source-end-date"
            type="date"
            value={endDate}
            min={source.effective_from}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
      )}

      {error && (
        <p role="alert" className="text-expense text-sm">
          {error}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        {conflict ? (
          <Button onClick={onEnd} disabled={end.isPending || !endDate}>
            {end.isPending ? "Saving..." : "Set end date"}
          </Button>
        ) : (
          <Button variant="destructive" onClick={onDelete} disabled={remove.isPending}>
            {remove.isPending ? "Deleting..." : "Delete"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
