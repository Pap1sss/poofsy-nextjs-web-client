"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { BudgetProgress } from "@/components/shared/budget-progress";
import { CategoryBadge } from "@/components/shared/category-badge";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { isZero } from "@/lib/money";

import { useDeleteAllocation, useUpdateAllocation } from "../hooks";
import { describeRule } from "../rule-summary";
import type { Allocation } from "../schema";

type AllocationRowProps = {
  budgetId: string;
  allocation: Allocation;
  editable: boolean;
};

export function AllocationRow({ budgetId, allocation, editable }: AllocationRowProps) {
  const { currency, locale } = useUserSettings();
  const update = useUpdateAllocation(budgetId);
  const remove = useDeleteAllocation(budgetId);
  const [amount, setAmount] = React.useState(allocation.amount.amount);
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  // Keep the field in step when the server's figure changes (recalculate, another tab).
  React.useEffect(() => setAmount(allocation.amount.amount), [allocation.amount.amount]);

  const save = (data: { amount?: string; rollover?: boolean }) =>
    update.mutate(
      { allocationId: allocation.id, data },
      {
        onError: (error) => {
          setAmount(allocation.amount.amount);
          toast.error(error.message);
        },
      }
    );

  const saveAmount = () => {
    const next = amount || "0";
    if (Number(next) !== Number(allocation.amount.amount)) save({ amount: next });
  };

  const rollover = !!allocation.rule?.rollover;
  const inputId = `allocation-${allocation.id}`;

  return (
    <li className="grid gap-3 py-4 md:grid-cols-[minmax(0,14rem)_10rem_minmax(0,1fr)] md:items-center md:gap-6">
      <div className="min-w-0 space-y-1">
        <CategoryBadge name={allocation.category.name} color={allocation.category.color} />
        <p className="text-muted-foreground text-xs">
          {describeRule(allocation.rule, currency, locale)}
          {!isZero(allocation.rollover_in) && (
            <>
              {" "}
              <MoneyDisplay value={allocation.rollover_in} tone="neutral" signed /> rolled over
            </>
          )}
        </p>
      </div>

      <div>
        {editable ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveAmount();
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Amount for {allocation.category.name}
            </label>
            <CurrencyInput
              id={inputId}
              value={amount}
              onChange={setAmount}
              onBlur={saveAmount}
              disabled={update.isPending}
              className="font-medium"
            />
          </form>
        ) : (
          <MoneyDisplay value={allocation.amount} className="text-lg font-semibold" />
        )}
      </div>

      {/* Phones: the bar takes the full width and its actions sit on their own row below. */}
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <BudgetProgress
          className="w-full min-w-0 sm:w-auto sm:flex-1"
          spent={allocation.actual}
          budget={allocation.budgeted}
          remaining={allocation.remaining}
          utilization={allocation.utilization}
          status={allocation.status}
          label={allocation.category.name}
        />
        {editable && (
          <div className="flex shrink-0 items-center justify-end gap-1">
            <label
              className="font-pixel hover:bg-accent flex min-h-11 cursor-pointer items-center gap-2 px-2 text-xs"
              title="Carry what's left into the next cutoff"
            >
              <Checkbox
                checked={rollover}
                disabled={update.isPending}
                onCheckedChange={(checked) => save({ rollover: checked === true })}
              />
              Roll over
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Remove ${allocation.category.name}`}
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        showTrigger={false}
        title={`Remove ${allocation.category.name} from this budget?`}
        description="Its transactions stay. They'll show as unbudgeted spending until you add it back."
        confirmLabel="Remove"
        confirmVariant="destructive"
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(allocation.id, {
            onSuccess: () => setConfirmRemove(false),
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </li>
  );
}
