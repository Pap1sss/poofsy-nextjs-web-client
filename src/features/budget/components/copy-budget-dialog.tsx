"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { routes } from "@/config/routes";

import { monthRange } from "../dates";
import { useCopyBudget, usePayPeriods } from "../hooks";

type CopyBudgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
};

/** Copies amounts and rules into another cutoff that has no budget yet. Transactions stay behind. */
export function CopyBudgetDialog({ open, onOpenChange, budgetId }: CopyBudgetDialogProps) {
  const router = useRouter();
  const range = React.useMemo(() => monthRange(-3, 3), []);
  const periods = usePayPeriods(range.from, range.to);
  const copy = useCopyBudget();
  const [periodId, setPeriodId] = React.useState("");

  const free = (periods.data ?? []).filter((p) => !p.budget);

  const submit = () =>
    copy.mutate(
      { id: budgetId, payPeriodId: periodId },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onOpenChange(false);
          router.push(routes.budgets.detail(res.data.id));
        },
        onError: (error) => toast.error(error.message),
      }
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy to another cutoff</DialogTitle>
          <DialogDescription>
            Copies every amount and rule. Transactions are not copied.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="copy-budget-period">Cutoff</FieldLabel>
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger id="copy-budget-period" className="w-full">
              <SelectValue
                placeholder={free.length ? "Choose a cutoff" : "Every nearby cutoff has a budget"}
              />
            </SelectTrigger>
            <SelectContent>
              {free.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!periodId || copy.isPending} onClick={submit}>
            {copy.isPending ? "Copying..." : "Copy budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
