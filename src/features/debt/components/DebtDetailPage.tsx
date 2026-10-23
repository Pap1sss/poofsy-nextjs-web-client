"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { Sprite } from "@/components/pixel/sprites";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { RowActionsMenu, type RowAction } from "@/components/shared/list-controls";
import { MoneyDisplay, useFormatMoney } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { moneySchema, type Money } from "@/lib/money";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/component";

import { DIRECTION_LABELS } from "../constant";
import { useCancelDebt, useDebt, useDeleteDebt, useReopenDebt, useVoidSettlement } from "../hooks";
import type { DebtDetail, DebtEvent, Settlement } from "../schema";
import { DebtForm } from "./DebtForm";
import { ReasonDialog } from "./ReasonDialog";
import { SettlementDialog } from "./SettlementDialog";
import {
  DebtProgress,
  DirectionBadge,
  directionTone,
  longDate,
  ROW_LIST,
  StatusBadge,
} from "./debt-bits";

const RECORD_AS_LABELS = {
  balance: "balance only",
  cash_flow: "as income/expense",
  none: "not in an account",
} as const;

export function DebtDetailPage({ debtId }: { debtId: string }) {
  const router = useRouter();
  const debt = useDebt(debtId);
  const cancel = useCancelDebt();
  const reopen = useReopenDebt();
  const remove = useDeleteDebt();
  const voidSettlement = useVoidSettlement();

  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [correcting, setCorrecting] = useState<Settlement | null>(null);
  const [voiding, setVoiding] = useState<Settlement | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useSetBreadcrumbTitle(debt.data ? `${debt.data.person.name}: ${debt.data.description}` : null);

  if (debt.isError) return <Error message={debt.error.message} />;
  if (!debt.data) return <DetailSkeleton />;

  const d = debt.data;
  const open = d.status !== "settled" && d.status !== "cancelled";
  const receivable = d.direction === "receivable";

  const actions: RowAction[] = [
    ...(d.status === "cancelled"
      ? [
          {
            label: "Reopen debt",
            onSelect: () =>
              reopen.mutate(d.id, {
                onSuccess: (res) => toast.success(res.message),
                onError: (e) => toast.error(e.message),
              }),
          },
        ]
      : open
        ? [{ label: "Cancel debt", onSelect: () => setCancelling(true), destructive: true }]
        : []),
    // Any payment, even a voided one, is history: such a debt is cancelled, not deleted.
    ...(d.settlements.length === 0
      ? [{ label: "Delete", onSelect: () => setDeleting(true), destructive: true }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="link" className="h-auto px-0">
        <Link href={routes.debts.home}>
          <ArrowLeft className="size-4" aria-hidden />
          All debts
        </Link>
      </Button>

      <PageHeader
        title={d.description}
        sprite="scroll"
        description={
          <>
            {receivable ? "Owed to you by " : "You owe "}
            <Link
              href={routes.debts.person(d.person.id)}
              className="text-foreground font-medium underline decoration-2 underline-offset-4"
            >
              {d.person.name}
            </Link>
            {` since ${longDate(d.debt_date)}.`}
          </>
        }
        actions={
          <>
            {open && (
              <Button onClick={() => setPaying(true)}>
                <Plus className="size-4" aria-hidden />
                Record payment
              </Button>
            )}
            {d.status !== "cancelled" && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
            )}
            {actions.length > 0 && (
              <RowActionsMenu label="More actions for this debt" actions={actions} />
            )}
          </>
        }
      />

      <Figures debt={d} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="payments" className="space-y-3">
          <h2 id="payments" className="text-lg">
            Payments
          </h2>
          {d.settlements.length === 0 ? (
            <div className="border-outline/40 text-muted-foreground border-2 border-dashed px-4 py-6 text-center text-sm">
              No payments yet.
              {open && (
                <>
                  {" "}
                  <Button variant="link" className="h-auto px-0" onClick={() => setPaying(true)}>
                    Record the first one
                  </Button>
                </>
              )}
            </div>
          ) : (
            <ul className={ROW_LIST}>
              {d.settlements.map((s) => (
                <SettlementRow
                  key={s.id}
                  settlement={s}
                  tone={directionTone(d.direction)}
                  onCorrect={d.status === "cancelled" ? undefined : () => setCorrecting(s)}
                  onVoid={() => setVoiding(s)}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="history" className="space-y-3">
          <h2 id="history" className="text-lg">
            History
          </h2>
          <ol className="pixel-panel space-y-3 p-4">
            {d.events.map((event) => (
              <EventLine key={event.id} event={event} />
            ))}
          </ol>
        </section>
      </div>

      <DebtForm open={editing} onOpenChange={setEditing} debt={d} />
      <SettlementDialog debt={paying ? d : null} onOpenChange={setPaying} />
      <SettlementDialog
        debt={correcting ? d : null}
        settlement={correcting}
        onOpenChange={(next) => !next && setCorrecting(null)}
      />
      <ReasonDialog
        open={!!voiding}
        onOpenChange={(next) => !next && setVoiding(null)}
        title="Void this payment?"
        description={
          voiding?.account
            ? `It stays in the history but stops counting, and its transaction in ${voiding.account.name} is deleted.`
            : "It stays in the history but stops counting toward the balance."
        }
        required
        confirmLabel="Void payment"
        onConfirm={async (reason) => {
          const res = await voidSettlement.mutateAsync({
            debtId: d.id,
            settlementId: voiding!.id,
            reason,
          });
          toast.success(res.message);
        }}
      />
      <ReasonDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title="Cancel this debt?"
        description="Use this when it won't be paid, e.g. it was forgiven. Its payments stay as history, and it stops counting toward your totals. You can reopen it later."
        confirmLabel="Cancel debt"
        onConfirm={async (reason) => {
          const res = await cancel.mutateAsync({ id: d.id, reason });
          toast.success(res.message);
        }}
      />
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={d.description}
        noun="debt"
        onDelete={async () => {
          const res = await remove.mutateAsync(d.id);
          toast.success(res.message);
          router.push(routes.debts.home);
        }}
      />
    </div>
  );
}

/** The status screen: what's left, how far along, and the facts of the debt. */
function Figures({ debt }: { debt: DebtDetail }) {
  const tone = directionTone(debt.direction);

  return (
    <section
      aria-label="Balance"
      className="pixel-panel grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:gap-8 md:p-6"
    >
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DirectionBadge direction={debt.direction} />
          <StatusBadge status={debt.status} />
        </div>
        <div>
          <p className="font-pixel text-muted-foreground text-sm">Remaining</p>
          <p className="font-stat text-5xl leading-none break-words sm:text-6xl">
            <MoneyDisplay
              value={debt.remaining}
              tone={debt.status === "cancelled" ? "neutral" : tone}
            />
          </p>
        </div>
        <DebtProgress
          percent={debt.progress_percent}
          label={`${debt.person.name}: ${debt.description}`}
        />
        {debt.status === "cancelled" && (
          <p className="text-muted-foreground text-sm">
            Cancelled{debt.cancelled_at ? ` ${formatDateTime(debt.cancelled_at)}` : ""}
            {debt.cancellation_reason ? `: ${debt.cancellation_reason}` : "."}
          </p>
        )}
      </div>

      <dl className="divide-border grid divide-y-2 divide-dashed text-sm md:border-l-2 md:border-dashed md:pl-8">
        <Fact label="Original amount">
          <MoneyDisplay value={debt.original_amount} tone="neutral" />
        </Fact>
        <Fact label={debt.direction === "receivable" ? "Paid back to me" : "Paid back by me"}>
          <MoneyDisplay value={debt.settled} tone="neutral" />
        </Fact>
        <Fact label="Direction">{DIRECTION_LABELS[debt.direction]}</Fact>
        <Fact label="Date">{longDate(debt.debt_date)}</Fact>
        <Fact label="Due">{debt.due_date ? longDate(debt.due_date) : "No due date"}</Fact>
        {debt.opening_account && (
          <Fact label={debt.direction === "receivable" ? "Taken from" : "Put into"}>
            {debt.opening_account.name}
          </Fact>
        )}
        {debt.reference_number && <Fact label="Reference">{debt.reference_number}</Fact>}
        {debt.notes && (
          <div className="py-2">
            <dt className="font-pixel text-muted-foreground text-xs">Notes</dt>
            <dd className="mt-1 whitespace-pre-line">{debt.notes}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="font-pixel text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function SettlementRow({
  settlement: s,
  tone,
  onCorrect,
  onVoid,
}: {
  settlement: Settlement;
  tone: "income" | "expense";
  onCorrect?: () => void;
  onVoid: () => void;
}) {
  const voided = !!s.voided_at;
  const details = [
    s.payment_method?.name,
    s.account
      ? `${s.account.name}, ${RECORD_AS_LABELS[s.record_as]}`
      : RECORD_AS_LABELS[s.record_as],
    s.reference_number && `Ref ${s.reference_number}`,
  ].filter(Boolean);

  return (
    <li className={cn("flex items-start gap-3 px-4 py-3 sm:px-5", voided && "opacity-60")}>
      <Sprite name={voided ? "alert" : "check"} size={20} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-pixel text-sm">{longDate(s.settlement_date)}</p>
          <MoneyDisplay
            value={s.amount}
            tone={voided ? "neutral" : tone}
            className={cn("font-stat text-2xl leading-none", voided && "line-through")}
          />
        </div>
        <p className="text-muted-foreground text-xs">{details.join(" · ")}</p>
        {s.notes && <p className="mt-1 text-sm whitespace-pre-line">{s.notes}</p>}
        {voided && (
          <p className="font-pixel text-expense mt-1 text-xs">
            Voided{s.void_reason ? `: ${s.void_reason}` : ""}
          </p>
        )}
      </div>
      {!voided && (
        <RowActionsMenu
          label={`Actions for the payment on ${longDate(s.settlement_date)}`}
          actions={[
            ...(onCorrect ? [{ label: "Correct", onSelect: onCorrect }] : []),
            { label: "Void", onSelect: onVoid, destructive: true },
          ]}
        />
      )}
    </li>
  );
}

const FIELD_LABELS: Record<string, string> = {
  original_amount: "amount",
  amount: "amount",
  debt_date: "date",
  settlement_date: "date",
  due_date: "due date",
  description: "description",
  notes: "notes",
  reference_number: "reference",
  person: "person",
  payment_method: "payment method",
};

const asMoney = (value: unknown): Money | null => {
  const parsed = moneySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/** One history line, worded here from the numbers the API logged (as with insights, D21). */
function EventLine({ event }: { event: DebtEvent }) {
  const format = useFormatMoney();
  const p = event.properties ?? {};
  const money = (value: unknown) => {
    const m = asMoney(value);
    return m ? format(m) : "";
  };
  const show = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "none";
    const m = asMoney(value);
    if (m) return format(m);
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? longDate(value)
      : String(value);
  };
  const changes = Object.entries(
    (p.changes ?? {}) as Record<string, { from: unknown; to: unknown }>
  ).map(([field, change]) =>
    field === "notes"
      ? "edited the notes"
      : `${FIELD_LABELS[field] ?? field} ${show(change.from)} → ${show(change.to)}`
  );
  const reason = typeof p.reason === "string" && p.reason ? `: ${p.reason}` : "";

  const text = {
    created: `Debt added for ${money(p.original_amount)}`,
    updated: `Edited: ${changes.join("; ")}`,
    settlement_recorded: `Payment of ${money(p.amount)} recorded; ${money(p.remaining)} left`,
    settlement_corrected: `Payment corrected: ${changes.join("; ")}`,
    settlement_voided: `Payment of ${money(p.amount)} voided${reason}`,
    cancelled: `Cancelled${reason}`,
    reopened: "Reopened",
  }[event.type];

  return (
    <li className="flex flex-col gap-0.5 border-l-2 border-dashed pl-3 text-sm">
      <span>{text}</span>
      {event.created_at && (
        <time dateTime={event.created_at} className="text-muted-foreground text-xs">
          {formatDateTime(event.created_at, "MMM dd yyyy, h:mm a")}
        </time>
      )}
    </li>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading debt">
      <Skeleton className="h-16 w-72" />
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
