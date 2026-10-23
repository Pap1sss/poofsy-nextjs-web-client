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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Voiding a payment needs a reason for the history; cancelling a debt doesn't. */
  required?: boolean;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<unknown>;
};

/** Confirms a financially significant step and keeps the reason in the debt's history. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  required = false,
  confirmLabel,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const close = (next: boolean) => {
    if (!next) {
      setReason("");
      setError(null);
    }
    onOpenChange(next);
  };

  const confirm = async () => {
    if (required && !reason.trim()) {
      setError("Say why, so the history makes sense later.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onConfirm(reason);
      close(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="reason-text">Reason{required ? "" : " (optional)"}</FieldLabel>
          <Textarea
            id="reason-text"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={!!error}
          />
          {error && <FieldError errors={[{ message: error }]} />}
        </Field>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close(false)}>
            Keep it
          </Button>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {pending ? "Saving..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
