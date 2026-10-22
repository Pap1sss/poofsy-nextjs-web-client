"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  MoreHorizontal,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routes } from "@/config/routes";

import { useActivateBudget, useBudgetAction, useDeleteBudget } from "../hooks";
import type { BudgetSummary } from "../schema";
import { CopyBudgetDialog } from "./copy-budget-dialog";

type Pending = "complete" | "reopen" | "delete" | null;

/** One primary action for the budget's state; the rest live in a menu so phones stay uncluttered. */
export function BudgetActions({ budget }: { budget: BudgetSummary }) {
  const router = useRouter();
  const activate = useActivateBudget();
  const action = useBudgetAction();
  const remove = useDeleteBudget();
  const [confirm, setConfirm] = React.useState<Pending>(null);
  const [copyOpen, setCopyOpen] = React.useState(false);

  const done = (message: string) => {
    toast.success(message);
    setConfirm(null);
  };
  const failed = (error: Error) => toast.error(error.message);

  const run = (kind: "complete" | "reopen" | "recalculate") =>
    action.mutate(
      { id: budget.id, action: kind },
      { onSuccess: (res) => done(res.message), onError: failed }
    );

  const isDraft = budget.status === "draft";
  const isCompleted = budget.status === "completed";

  return (
    <>
      {isDraft && (
        <Button
          disabled={activate.isPending}
          onClick={() =>
            activate.mutate(budget.id, {
              onSuccess: () => toast.success("Budget started."),
              onError: failed,
            })
          }
        >
          <Play className="size-4" aria-hidden />
          Start budget
        </Button>
      )}
      {budget.status === "active" && (
        <Button onClick={() => setConfirm("complete")}>
          <CheckCircle2 className="size-4" aria-hidden />
          Complete cutoff
        </Button>
      )}
      {isCompleted && (
        <Button variant="outline" onClick={() => setConfirm("reopen")}>
          <RotateCcw className="size-4" aria-hidden />
          Reopen
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="size-9" aria-label="More budget actions">
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isDraft && (
            <DropdownMenuItem onSelect={() => setConfirm("complete")}>
              <CheckCircle2 className="size-4" aria-hidden />
              Complete cutoff
            </DropdownMenuItem>
          )}
          {!isCompleted && (
            <DropdownMenuItem
              disabled={budget.income.basis !== "actual" || action.isPending}
              onSelect={() => run("recalculate")}
            >
              <RefreshCw className="size-4" aria-hidden />
              {budget.income.basis === "actual"
                ? "Recalculate from actual income"
                : "Recalculate (record income first)"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setCopyOpen(true)}>
            <Copy className="size-4" aria-hidden />
            Copy to another cutoff
          </DropdownMenuItem>
          {isDraft && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
                <Trash2 className="size-4" aria-hidden />
                Delete draft
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === "complete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        showTrigger={false}
        title={`Complete ${budget.pay_period.label}?`}
        description="This locks the budget. Unused amounts in categories set to roll over move into the next cutoff's budget. You can reopen it later."
        confirmLabel="Complete cutoff"
        isPending={action.isPending}
        onConfirm={() => run("complete")}
      />
      <ConfirmDialog
        open={confirm === "reopen"}
        onOpenChange={(open) => !open && setConfirm(null)}
        showTrigger={false}
        title="Reopen this budget?"
        description="You'll be able to change it again. Completing it again recalculates what rolls over."
        confirmLabel="Reopen"
        isPending={action.isPending}
        onConfirm={() => run("reopen")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        showTrigger={false}
        title="Delete this draft budget?"
        description="Its allocations are removed. Transactions in this cutoff stay."
        confirmLabel="Delete draft"
        confirmVariant="destructive"
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(budget.id, {
            onSuccess: () => {
              done("Draft deleted.");
              router.push(routes.budgets.home);
            },
            onError: failed,
          })
        }
      />
      <CopyBudgetDialog open={copyOpen} onOpenChange={setCopyOpen} budgetId={budget.id} />
    </>
  );
}
