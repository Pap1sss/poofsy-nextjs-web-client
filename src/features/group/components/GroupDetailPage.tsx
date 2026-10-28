"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { CategoryBadge } from "@/components/shared/category-badge";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu, type RowAction } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { ReasonDialog } from "@/features/debt/components/ReasonDialog";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { isZero } from "@/lib/money";
import { cn } from "@/lib/utils/component";

import { ALLOCATION_LABELS, CHARGE_LABELS, isDiscount, SPLIT_LABELS } from "../constant";
import {
  useAddParticipant,
  useArchiveParticipant,
  useCompleteGroup,
  useGroup,
  useRemoveExpense,
  useRemoveParticipant,
  useVoidGroupSettlement,
} from "../hooks";
import type {
  GroupDetail,
  GroupExpense,
  GroupSettlement,
  Participant,
  Suggestion,
} from "../schema";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { ExpenseForm } from "./ExpenseForm";
import { GroupForm } from "./GroupForm";
import { ParticipantDialog } from "./ParticipantDialog";
import { SettlementForm } from "./SettlementForm";
import {
  GroupAvatar,
  longDate,
  NetAmount,
  ROW_LIST,
  SettleProgress,
  StandingBadge,
  StatusBadge,
} from "./group-bits";

// Pixel tab bar (same look as the Debts and Bills tabs).
const TAB_LIST = "pixel-box bg-muted h-auto flex-wrap gap-1 rounded-none p-1";
const TAB =
  "font-pixel rounded-none border-2 border-transparent px-3 data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none focus-visible:outline-3 focus-visible:outline-highlight";

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const router = useRouter();
  const query = useGroup(groupId);
  const complete = useCompleteGroup();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expenseForm, setExpenseForm] = useState<{ expense: GroupExpense | null } | null>(null);
  const [settleForm, setSettleForm] = useState<{
    settlement?: GroupSettlement | null;
    suggestion?: Suggestion | null;
  } | null>(null);
  const [tab, setTab] = useState("overview");

  useSetBreadcrumbTitle(query.data?.name ?? null);

  if (query.isError) return <Error message={query.error.message} />;
  if (!query.data) return <DetailSkeleton />;

  const group = query.data;
  const active = group.status === "active";

  const actions: RowAction[] = [
    {
      label: active ? "Mark completed" : "Reopen group",
      onSelect: () =>
        complete.mutate(
          { id: group.id, complete: active },
          { onSuccess: (res) => toast.success(res.message), onError: (e) => toast.error(e.message) }
        ),
    },
    { label: "Delete group", onSelect: () => setDeleting(true), destructive: true },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="link" className="h-auto px-0">
        <Link href={routes.groups.home}>
          <ArrowLeft className="size-4" aria-hidden />
          All groups
        </Link>
      </Button>

      <div className="flex items-start gap-4">
        <GroupAvatar
          color={group.color}
          icon={group.icon}
          size={56}
          className="hidden sm:inline-flex"
        />
        <PageHeader
          title={group.name}
          className="flex-1"
          description={
            <>
              {group.description ? `${group.description} · ` : ""}
              Since {longDate(group.started_on)}
            </>
          }
          actions={
            <>
              {active && (
                <Button onClick={() => setExpenseForm({ expense: null })}>
                  <Plus className="size-4" aria-hidden />
                  Add expense
                </Button>
              )}
              {active && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
              )}
              <RowActionsMenu label="More actions for this group" actions={actions} />
            </>
          }
        />
      </div>

      {!active && (
        <Alert>
          <AlertDescription>
            This group is completed, so it can&apos;t be changed. Reopen it from the menu to add
            expenses or payments.
          </AlertDescription>
        </Alert>
      )}

      <Figures group={group} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className={TAB_LIST}>
          <TabsTrigger value="overview" className={TAB}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className={TAB}>
            Expenses ({group.expenses.length})
          </TabsTrigger>
          <TabsTrigger value="people" className={TAB}>
            People ({group.participants.length})
          </TabsTrigger>
          <TabsTrigger value="settlements" className={TAB}>
            Settlements ({group.settlements.filter((s) => !s.voided_at).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Balances group={group} />
          <Suggestions
            group={group}
            onRecord={(suggestion) => setSettleForm({ suggestion })}
            onRecordOther={() => setSettleForm({})}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <Expenses
            group={group}
            onAdd={() => setExpenseForm({ expense: null })}
            onEdit={(expense) => setExpenseForm({ expense })}
          />
        </TabsContent>

        <TabsContent value="people">
          <People group={group} />
        </TabsContent>

        <TabsContent value="settlements">
          <Settlements
            group={group}
            onRecord={() => setSettleForm({})}
            onCorrect={(settlement) => setSettleForm({ settlement })}
          />
        </TabsContent>
      </Tabs>

      <GroupForm open={editing} onOpenChange={setEditing} group={group} />
      <DeleteGroupDialog
        group={deleting ? group : null}
        onOpenChange={setDeleting}
        onDeleted={() => {
          toast.success("Group deleted.");
          router.push(routes.groups.home);
        }}
      />
      <ExpenseForm
        group={group}
        expense={expenseForm?.expense ?? null}
        open={!!expenseForm}
        onOpenChange={(open) => !open && setExpenseForm(null)}
      />
      <SettlementForm
        group={group}
        open={!!settleForm}
        onOpenChange={(open) => !open && setSettleForm(null)}
        settlement={settleForm?.settlement}
        suggestion={settleForm?.suggestion}
      />
    </div>
  );
}

/** The signed-in user's position, then the group's totals. Every figure comes from the API. */
function Figures({ group }: { group: GroupDetail }) {
  return (
    <section aria-label="Group summary" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          sprite="bag"
          label="Total spent"
          value={<MoneyDisplay value={group.total_expenses} tone="neutral" />}
          hint={`${group.expenses_count} ${group.expenses_count === 1 ? "expense" : "expenses"}`}
        />
        {group.my_paid && group.my_share && (
          <>
            <StatCard
              sprite="wallet"
              label="I paid"
              value={<MoneyDisplay value={group.my_paid} tone="neutral" />}
              hint="Cash out for the group"
            />
            <StatCard
              sprite="receipt"
              label="My share"
              value={<MoneyDisplay value={group.my_share} tone="neutral" />}
              hint="What I consumed"
            />
          </>
        )}
        {group.owed_to_me && group.i_owe && (
          <StatCard
            sprite="coin"
            label={isZero(group.i_owe) ? "Owed to me" : "I owe"}
            value={
              isZero(group.i_owe) ? (
                <MoneyDisplay
                  value={group.owed_to_me}
                  tone={isZero(group.owed_to_me) ? "neutral" : "income"}
                />
              ) : (
                <MoneyDisplay value={group.i_owe} tone="expense" />
              )
            }
            hint={
              isZero(group.i_owe) && isZero(group.owed_to_me) ? "All square" : "After settlements"
            }
            className={cn(
              "border-l-8",
              isZero(group.i_owe) ? "border-l-income" : "border-l-expense"
            )}
          />
        )}
      </div>
      <div className="pixel-panel flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={group.status} />
          <span className="text-sm">
            Still to settle: <MoneyDisplay value={group.outstanding} tone="neutral" />
          </span>
        </div>
        <SettleProgress
          percent={group.progress_percent}
          label={group.name}
          className="min-w-48 flex-1"
        />
      </div>
    </section>
  );
}

function Balances({ group }: { group: GroupDetail }) {
  if (group.participants.length === 0) {
    return (
      <EmptyState title="Nobody in this group yet" description="Add people on the People tab." />
    );
  }

  return (
    <section aria-labelledby="balances" className="space-y-2">
      <h2 id="balances" className="text-lg">
        Who owes whom
      </h2>
      <p className="text-muted-foreground text-sm">
        Balance = what someone paid for the group − their share + payments they made − payments they
        received.
      </p>
      <ul className={ROW_LIST}>
        {group.participants.map((p) => (
          <li
            key={p.id}
            className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_minmax(0,1.3fr)]"
          >
            <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
              <span className="font-pixel truncate">
                {p.name}
                {p.is_me && <span className="text-muted-foreground font-sans"> (me)</span>}
              </span>
              <StandingBadge standing={p.standing} />
            </div>
            <Labeled label="Paid">
              <MoneyDisplay value={p.paid} tone="neutral" />
            </Labeled>
            <Labeled label="Share">
              <MoneyDisplay value={p.share} tone="neutral" />
            </Labeled>
            <Labeled label="Settled">
              <span className="text-xs">
                sent <MoneyDisplay value={p.settled_sent} tone="neutral" /> · got{" "}
                <MoneyDisplay value={p.settled_received} tone="neutral" />
              </span>
            </Labeled>
            <Labeled label="Balance" className="sm:text-right">
              <NetAmount net={p.net} className="font-stat text-2xl leading-none" />
            </Labeled>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Labeled({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="font-pixel text-muted-foreground block text-xs">{label}</span>
      {children}
    </div>
  );
}

function Suggestions({
  group,
  onRecord,
  onRecordOther,
}: {
  group: GroupDetail;
  onRecord: (s: Suggestion) => void;
  onRecordOther: () => void;
}) {
  const active = group.status === "active";

  return (
    <section aria-labelledby="suggested" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="suggested" className="text-lg">
          Suggested settlements
        </h2>
        {active && group.suggestions.length > 0 && (
          <Button variant="outline" size="sm" onClick={onRecordOther}>
            Record another payment
          </Button>
        )}
      </div>
      {group.suggestions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {group.expenses_count === 0
            ? "Add an expense to see who should pay whom."
            : "Everyone is settled. Nothing to pay."}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            The fewest payments that clear every balance. Nothing is recorded until you confirm each
            one.
          </p>
          <ul className={ROW_LIST}>
            {group.suggestions.map((s) => (
              <li
                key={`${s.from.id}-${s.to.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="font-pixel">{s.from.name}</span>
                <ArrowRight className="text-muted-foreground size-4" aria-label="pays" />
                <span className="font-pixel">{s.to.name}</span>
                <MoneyDisplay
                  value={s.amount}
                  tone="neutral"
                  className="font-stat ml-auto text-2xl leading-none"
                />
                {active && (
                  <Button size="sm" onClick={() => onRecord(s)}>
                    Record
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Expenses({
  group,
  onAdd,
  onEdit,
}: {
  group: GroupDetail;
  onAdd: () => void;
  onEdit: (e: GroupExpense) => void;
}) {
  const remove = useRemoveExpense();
  const [deleting, setDeleting] = useState<GroupExpense | null>(null);
  const active = group.status === "active";

  if (group.expenses.length === 0) {
    return (
      <EmptyState
        sprite="receipt"
        title="No expenses yet"
        description="Add what was bought, who paid, and how to split it."
        action={active ? <Button onClick={onAdd}>Add expense</Button> : undefined}
      />
    );
  }

  return (
    <>
      <ul className={ROW_LIST}>
        {group.expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            group={group}
            actions={
              active
                ? [
                    { label: "Edit", onSelect: () => onEdit(expense) },
                    { label: "Delete", onSelect: () => setDeleting(expense), destructive: true },
                  ]
                : []
            }
          />
        ))}
      </ul>
      <DeleteRecordDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        name={deleting?.description ?? ""}
        noun="expense"
        onDelete={() =>
          remove
            .mutateAsync({ id: group.id, expenseId: deleting!.id })
            .then((res) => toast.success(res.message))
        }
      />
    </>
  );
}

function ExpenseRow({
  expense,
  group,
  actions,
}: {
  expense: GroupExpense;
  group: GroupDetail;
  actions: RowAction[];
}) {
  const name = (id: string) => group.participants.find((p) => p.id === id)?.name ?? "Someone";
  const payers = expense.payers.map((p) => name(p.participant_id)).join(", ");

  return (
    <li className="px-4 py-3">
      <details className="group/expense">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <p className="font-pixel truncate">{expense.description}</p>
            <p className="text-muted-foreground text-xs">
              {longDate(expense.expense_date)} · paid by {payers} ·{" "}
              {SPLIT_LABELS[expense.split_method].toLowerCase()}
            </p>
          </div>
          {expense.category && (
            <CategoryBadge name={expense.category.name} color={expense.category.color} />
          )}
          <div className="text-right">
            <MoneyDisplay
              value={expense.total_amount}
              tone="neutral"
              className="font-stat block text-2xl leading-none"
            />
            {expense.my_share && (
              <span className="text-muted-foreground text-xs">
                my share <MoneyDisplay value={expense.my_share} tone="neutral" />
              </span>
            )}
          </div>
          <ChevronDown
            className="text-muted-foreground size-4 transition-transform group-open/expense:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="mt-3 space-y-3 text-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground text-left text-xs">
                  <th className="py-1 font-normal">Person</th>
                  <th className="py-1 text-right font-normal">Base</th>
                  <th className="py-1 text-right font-normal">Fees</th>
                  <th className="py-1 text-right font-normal">Discounts</th>
                  <th className="py-1 text-right font-normal">Share</th>
                  <th className="py-1 text-right font-normal">Paid</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {expense.allocations.map((a) => {
                  const paid = expense.payers.find((p) => p.participant_id === a.participant_id);
                  return (
                    <tr key={a.participant_id} className="border-border border-t border-dashed">
                      <td className="py-1">{name(a.participant_id)}</td>
                      <td className="py-1 text-right">
                        <MoneyDisplay value={a.base} tone="neutral" />
                      </td>
                      <td className="py-1 text-right">
                        <MoneyDisplay value={a.charges} tone="neutral" />
                      </td>
                      <td className="py-1 text-right">
                        <MoneyDisplay value={a.discounts} tone="neutral" />
                      </td>
                      <td className="py-1 text-right font-medium">
                        <MoneyDisplay value={a.total} tone="neutral" />
                      </td>
                      <td className="py-1 text-right">
                        {paid ? <MoneyDisplay value={paid.amount} tone="neutral" /> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {expense.items.length > 0 && (
            <div>
              <h4 className="font-pixel text-xs">Items</h4>
              <ul className="space-y-0.5">
                {expense.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {item.name} × {item.quantity}
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.participant_ids.map(name).join(", ")}
                      </span>
                    </span>
                    <MoneyDisplay value={item.line_total} tone="neutral" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expense.charges.length > 0 && (
            <div>
              <h4 className="font-pixel text-xs">Fees and discounts</h4>
              <ul className="space-y-0.5">
                {expense.charges.map((charge) => (
                  <li key={charge.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {charge.label || CHARGE_LABELS[charge.kind]}
                      <span className="text-muted-foreground">
                        {" "}
                        · {ALLOCATION_LABELS[charge.allocation].toLowerCase()}
                      </span>
                    </span>
                    <span className={isDiscount(charge.kind) ? "text-income" : undefined}>
                      {isDiscount(charge.kind) ? "−" : ""}
                      <MoneyDisplay value={charge.amount} tone="neutral" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expense.my_share && expense.my_paid && (
            <p className="text-muted-foreground">
              I paid <MoneyDisplay value={expense.my_paid} tone="neutral" />; my share is{" "}
              <MoneyDisplay value={expense.my_share} tone="neutral" />.{" "}
              {expense.record_share
                ? `My share is counted in my budget${expense.share_account ? ` (paid from ${expense.share_account.name})` : ""}.`
                : "Not counted in my budget."}
            </p>
          )}

          {expense.notes && <p className="whitespace-pre-line">{expense.notes}</p>}

          {actions.length > 0 && (
            <div className="flex justify-end">
              <RowActionsMenu label={`Actions for ${expense.description}`} actions={actions} />
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

function People({ group }: { group: GroupDetail }) {
  const active = group.status === "active";
  const addMe = useAddParticipant();
  const archive = useArchiveParticipant();
  const remove = useRemoveParticipant();
  const [dialog, setDialog] = useState<{ participant: Participant | null } | null>(null);
  const [removing, setRemoving] = useState<Participant | null>(null);
  const hasMe = group.participants.some((p) => p.is_me);
  const notify = {
    onSuccess: (res: { message: string }) => toast.success(res.message),
    onError: (e: Error) => toast.error(e.message),
  };

  return (
    <section className="space-y-3">
      {active && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog({ participant: null })}>
            <Plus className="size-4" aria-hidden />
            Add someone
          </Button>
          {!hasMe && (
            <Button
              variant="outline"
              disabled={addMe.isPending}
              onClick={() => addMe.mutate({ id: group.id, values: { is_me: true } }, notify)}
            >
              Add me
            </Button>
          )}
        </div>
      )}
      <ul className={ROW_LIST}>
        {group.participants.map((p) => {
          const actions: RowAction[] = active
            ? [
                { label: "Rename", onSelect: () => setDialog({ participant: p }) },
                p.archived_at
                  ? {
                      label: "Restore",
                      onSelect: () =>
                        archive.mutate(
                          { id: group.id, participantId: p.id, archived: false },
                          notify
                        ),
                    }
                  : {
                      label: "Archive",
                      onSelect: () =>
                        archive.mutate(
                          { id: group.id, participantId: p.id, archived: true },
                          notify
                        ),
                    },
                ...(p.in_use
                  ? []
                  : [{ label: "Remove", onSelect: () => setRemoving(p), destructive: true }]),
              ]
            : [];
          return (
            <li
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-3 px-4 py-3",
                p.archived_at && "opacity-60"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-pixel truncate">
                  {p.name}
                  {p.is_me && <span className="text-muted-foreground font-sans"> (me)</span>}
                </p>
                <p className="text-muted-foreground text-xs">
                  {p.archived_at
                    ? "Archived: kept in history, can't join new expenses"
                    : p.in_use
                      ? "Part of expenses or payments"
                      : "Not in any expense yet"}
                </p>
              </div>
              <NetAmount net={p.net} className="text-sm" />
              {actions.length > 0 && (
                <RowActionsMenu label={`Actions for ${p.name}`} actions={actions} />
              )}
            </li>
          );
        })}
      </ul>

      <ParticipantDialog
        groupId={group.id}
        open={!!dialog}
        onOpenChange={(open) => !open && setDialog(null)}
        participant={dialog?.participant ?? null}
      />
      <DeleteRecordDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        name={removing?.name ?? ""}
        noun="participant"
        onDelete={() => remove.mutateAsync({ id: group.id, participantId: removing!.id })}
        onArchive={() =>
          archive.mutateAsync({ id: group.id, participantId: removing!.id, archived: true })
        }
      />
    </section>
  );
}

function Settlements({
  group,
  onRecord,
  onCorrect,
}: {
  group: GroupDetail;
  onRecord: () => void;
  onCorrect: (s: GroupSettlement) => void;
}) {
  const active = group.status === "active";
  const voidSettlement = useVoidGroupSettlement();
  const [voiding, setVoiding] = useState<GroupSettlement | null>(null);

  return (
    <section className="space-y-3">
      {active && group.expenses_count > 0 && (
        <Button onClick={onRecord}>
          <Plus className="size-4" aria-hidden />
          Record a payment
        </Button>
      )}
      {group.settlements.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="When someone pays back, record it here. Their balance updates right away."
        />
      ) : (
        <ul className={ROW_LIST}>
          {group.settlements.map((s) => (
            <li
              key={s.id}
              className={cn(
                "flex flex-wrap items-center gap-3 px-4 py-3",
                s.voided_at && "opacity-60"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("font-pixel", s.voided_at && "line-through decoration-2")}>
                  {s.from.name} paid {s.to.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {longDate(s.settlement_date)}
                  {s.account && ` · ${s.account.name}`}
                  {s.reference_number && ` · ref ${s.reference_number}`}
                  {s.voided_at && ` · voided: ${s.void_reason}`}
                </p>
                {s.notes && <p className="text-xs">{s.notes}</p>}
              </div>
              <MoneyDisplay
                value={s.amount}
                tone="neutral"
                className="font-stat text-2xl leading-none"
              />
              {active && !s.voided_at && (
                <RowActionsMenu
                  label={`Actions for the payment from ${s.from.name}`}
                  actions={[
                    { label: "Correct", onSelect: () => onCorrect(s) },
                    { label: "Void", onSelect: () => setVoiding(s), destructive: true },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ReasonDialog
        open={!!voiding}
        onOpenChange={(open) => !open && setVoiding(null)}
        title="Void this payment?"
        description="It stays in the history but stops counting, so the balances go back to before it. Any account movement it made is removed."
        required
        confirmLabel="Void payment"
        onConfirm={(reason) =>
          voidSettlement
            .mutateAsync({ id: group.id, settlementId: voiding!.id, reason })
            .then((res) => toast.success(res.message))
        }
      />
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading group">
      <Skeleton className="h-16 w-2/3" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
