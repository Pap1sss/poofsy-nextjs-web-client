"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Sprite } from "@/components/pixel/sprites";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListStatusTabs, RowActionsMenu, type ListStatus } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useArchiveGoal,
  useDeleteGoal,
  useRemoveContribution,
  useRestoreGoal,
  useSavingsGoals,
} from "../hooks";
import type { Contribution, ContributionType, EarmarkWarning, SavingsGoal } from "../schema";
import { ContributionDialog } from "./ContributionDialog";
import { GoalForm } from "./GoalForm";
import { GoalProgress } from "./GoalProgress";

const longDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

export default function GoalsPage() {
  const [status, setStatus] = useState<ListStatus>("active");
  const goals = useSavingsGoals(status);

  const [form, setForm] = useState<{ open: boolean; goal: SavingsGoal | null; emergency: boolean }>(
    {
      open: false,
      goal: null,
      emergency: false,
    }
  );
  const [contributing, setContributing] = useState<{
    goal: SavingsGoal;
    type: ContributionType;
  } | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);

  const remove = useDeleteGoal();
  const archive = useArchiveGoal();
  const restore = useRestoreGoal();

  const list = goals.data?.goals ?? [];
  const emergencyFund = list.find((g) => g.is_emergency_fund);
  const others = list.filter((g) => !g.is_emergency_fund);

  const openForm = (goal: SavingsGoal | null, emergency = false) =>
    setForm({ open: true, goal, emergency });

  const actionsFor = (goal: SavingsGoal) =>
    status === "active"
      ? [
          {
            label: "Take money out",
            onSelect: () => setContributing({ goal, type: "withdrawal" as const }),
          },
          { label: "Edit", onSelect: () => openForm(goal) },
          {
            label: "Archive",
            onSelect: () =>
              archive.mutate(goal.id, { onSuccess: (res) => toast.success(res.message) }),
          },
          { label: "Delete", onSelect: () => setDeleting(goal), destructive: true },
        ]
      : [
          {
            label: "Restore",
            onSelect: () =>
              restore.mutate(goal.id, { onSuccess: (res) => toast.success(res.message) }),
          },
        ];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Savings goals"
        sprite="scroll"
        description="Your quests. Goals set aside money inside your accounts; they never count as extra money."
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus className="size-4" aria-hidden />
            Add goal
          </Button>
        }
      />

      <ListStatusTabs value={status} onValueChange={setStatus} />

      {goals.isError ? (
        <Error message={goals.error.message} />
      ) : goals.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {status === "active" && <EarmarkWarnings warnings={goals.data?.warnings ?? []} />}

          {status === "active" &&
            (emergencyFund ? (
              <EmergencyFund
                goal={emergencyFund}
                onContribute={(type) => setContributing({ goal: emergencyFund, type })}
                actions={actionsFor(emergencyFund)}
              />
            ) : (
              <div className="border-outline/40 flex flex-col gap-3 border-2 border-dashed px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-start gap-3">
                  <Sprite name="piggy" size={28} className="mt-0.5" />
                  <div>
                    <p className="font-pixel">Main quest: no emergency fund yet</p>
                    <p className="text-muted-foreground text-sm">
                      Cover a few months of essentials, so a surprise bill doesn&apos;t become debt.
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => openForm(null, true)}>
                  Set up emergency fund
                </Button>
              </div>
            ))}

          {(status === "archived" ? list : others).length > 0 ? (
            <section aria-labelledby="goals-heading" className="space-y-3">
              <h2 id="goals-heading" className="flex items-center gap-2 text-lg">
                <Sprite name="flag" size={18} />
                {status === "archived" ? "Archived quests" : "Side quests"}
              </h2>
              <ul className="pixel-panel divide-border divide-y-2 px-1 py-1">
                {(status === "archived" ? list : others).map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    archived={status === "archived"}
                    onAdd={() => setContributing({ goal, type: "contribution" })}
                    actions={actionsFor(goal)}
                  />
                ))}
              </ul>
            </section>
          ) : status === "archived" ? (
            <EmptyState
              title="Nothing archived"
              description="Goals you archive keep their contributions and show up here."
            />
          ) : (
            <EmptyState
              sprite="scroll"
              title="No quests yet"
              description="Add something you're saving for, like a new laptop or a trip, and track it each payday."
              action={<Button onClick={() => openForm(null)}>Add goal</Button>}
            />
          )}
        </>
      )}

      <GoalForm
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        goal={form.goal}
        emergency={form.emergency}
        canBeEmergencyFund={!emergencyFund || form.goal?.id === emergencyFund.id}
      />
      <ContributionDialog
        goal={contributing?.goal ?? null}
        type={contributing?.type ?? "contribution"}
        onOpenChange={(open) => !open && setContributing(null)}
      />
      {deleting && (
        <DeleteRecordDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          name={deleting.name}
          noun="goal"
          onDelete={() => remove.mutateAsync(deleting.id).then((res) => toast.success(res.message))}
          onArchive={() =>
            archive.mutateAsync(deleting.id).then((res) => toast.success(res.message))
          }
        />
      )}
    </div>
  );
}

function EarmarkWarnings({ warnings }: { warnings: EarmarkWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div role="status" className="pixel-panel space-y-2 px-5 py-4">
      {warnings.map((warning) => (
        <p key={warning.account.id} className="flex items-start gap-3 text-sm">
          <Sprite name="alert" size={20} className="shrink-0" />
          <span>
            <span className="sr-only">Warning: </span>
            Goals in {warning.account.name} add up to{" "}
            <MoneyDisplay value={warning.over_by} tone="neutral" className="font-medium" /> more
            than its balance of <MoneyDisplay value={warning.balance} tone="neutral" />. Add money
            to the account or lower a goal.
          </span>
        </p>
      ))}
    </div>
  );
}

function EmergencyFund({
  goal,
  onContribute,
  actions,
}: {
  goal: SavingsGoal;
  onContribute: (type: ContributionType) => void;
  actions: { label: string; onSelect: () => void; destructive?: boolean }[];
}) {
  const months = goal.emergency_months ?? 6;

  return (
    <section aria-labelledby="emergency-heading" className="pixel-panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-pixel bg-highlight text-highlight-foreground border-outline inline-block border-2 px-2 text-xs">
            Main quest
          </p>
          <h2 id="emergency-heading" className="mt-2 flex items-center gap-2 text-xl">
            <Sprite name="star" size={24} />
            {goal.name}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {goal.target_is_computed && goal.essential_monthly ? (
              <>
                {months} months of essential spending, at{" "}
                <MoneyDisplay value={goal.essential_monthly} tone="neutral" /> a month based on the
                last 3 months.
              </>
            ) : (
              <>
                Target you set. It&apos;ll follow your costs once you have 3 months of spending in
                essential categories.
              </>
            )}
          </p>
        </div>
        <RowActionsMenu label={`Actions for ${goal.name}`} actions={actions} />
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight">
        <MoneyDisplay value={goal.saved} />
        <span className="text-muted-foreground text-base font-normal">
          {" "}
          of <MoneyDisplay value={goal.target_amount} tone="neutral" />
        </span>
      </p>
      <GoalProgress percent={goal.progress_percent} label={goal.name} className="mt-3" />

      <dl className="text-muted-foreground mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <dt className="inline">Still to save: </dt>
          <dd className="text-foreground inline">
            <MoneyDisplay value={goal.remaining} tone="neutral" />
          </dd>
        </div>
        {goal.monthly_needed && goal.target_date && (
          <div>
            <dt className="inline">To finish by {longDate(goal.target_date)}: </dt>
            <dd className="text-foreground inline">
              <MoneyDisplay value={goal.monthly_needed} tone="neutral" /> a month
            </dd>
          </div>
        )}
        {goal.account && (
          <div>
            <dt className="inline">Kept in: </dt>
            <dd className="text-foreground inline">{goal.account.name}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => onContribute("contribution")}>Add money</Button>
        <Button variant="outline" onClick={() => onContribute("withdrawal")}>
          Take money out
        </Button>
      </div>

      <ContributionHistory goal={goal} />
    </section>
  );
}

function GoalRow({
  goal,
  archived,
  onAdd,
  actions,
}: {
  goal: SavingsGoal;
  archived: boolean;
  onAdd: () => void;
  actions: { label: string; onSelect: () => void; destructive?: boolean }[];
}) {
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <Sprite name={archived ? "scroll" : "flag"} size={22} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-pixel truncate text-base">{goal.name}</p>
          <p className="text-muted-foreground text-sm">
            {[
              goal.account ? `Kept in ${goal.account.name}` : null,
              goal.target_date ? `By ${longDate(goal.target_date)}` : null,
            ]
              .filter(Boolean)
              .join(". ") || "No account or date set"}
          </p>
        </div>
        <p className="text-right">
          <MoneyDisplay value={goal.saved} className="text-lg font-bold" />
          <span className="text-muted-foreground block text-sm">
            of <MoneyDisplay value={goal.target_amount} tone="neutral" />
          </span>
        </p>
        <RowActionsMenu label={`Actions for ${goal.name}`} actions={actions} />
      </div>

      <GoalProgress percent={goal.progress_percent} label={goal.name} className="mt-3" />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {!archived && (
          <Button size="sm" variant="outline" className="min-h-11 sm:min-h-9" onClick={onAdd}>
            Add money
          </Button>
        )}
        {goal.monthly_needed && (
          <p className="text-muted-foreground text-sm">
            <MoneyDisplay value={goal.monthly_needed} tone="neutral" /> a month to finish on time
          </p>
        )}
      </div>

      <ContributionHistory goal={goal} />
    </li>
  );
}

function ContributionHistory({ goal }: { goal: SavingsGoal }) {
  const [removing, setRemoving] = useState<Contribution | null>(null);
  const removeContribution = useRemoveContribution();

  if (goal.contributions.length === 0) return null;

  return (
    <Collapsible className="mt-3">
      <CollapsibleTrigger className="font-pixel text-muted-foreground hover:text-foreground focus-visible:outline-highlight group flex min-h-11 items-center gap-1 text-sm outline-none focus-visible:outline-3">
        <ChevronDown
          className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
        History ({goal.contributions.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="pixel-box bg-card divide-border divide-y">
          {goal.contributions.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="text-muted-foreground w-28 shrink-0">{longDate(c.date)}</span>
              <span className="min-w-0 flex-1 truncate">
                {c.type === "withdrawal" ? "Taken out" : "Added"}
                {c.notes ? `: ${c.notes}` : ""}
              </span>
              <MoneyDisplay
                value={
                  c.type === "withdrawal"
                    ? { ...c.amount, amount: `-${c.amount.amount}` }
                    : c.amount
                }
                tone={c.type === "withdrawal" ? "neutral" : "income"}
                signed
              />
              <Button
                size="sm"
                variant="ghost"
                className="min-h-11 sm:min-h-8"
                onClick={() => setRemoving(c)}
                aria-label={`Remove ${c.type === "withdrawal" ? "withdrawal" : "contribution"} from ${longDate(c.date)}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </CollapsibleContent>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        showTrigger={false}
        title="Remove this entry?"
        description={
          removing?.transaction_id
            ? "The goal's progress changes, but the money stays where it is. Delete its transfer on the Transactions page to move it back."
            : "The goal's progress changes. No money moves."
        }
        confirmLabel="Remove"
        confirmVariant="destructive"
        isPending={removeContribution.isPending}
        onConfirm={() =>
          removing &&
          removeContribution.mutate(
            { goalId: goal.id, contributionId: removing.id },
            {
              onSuccess: (res) => {
                toast.success(res.message);
                setRemoving(null);
              },
              onError: (error) => toast.error(error.message),
            }
          )
        }
      />
    </Collapsible>
  );
}
