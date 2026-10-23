"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCog, Pencil, Plus } from "lucide-react";
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
import { ReasonDialog } from "@/features/debt/components/ReasonDialog";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { isZero, moneySchema, type Money } from "@/lib/money";
import { cn } from "@/lib/utils/component";
import { formatDateTime } from "@/lib/utils/date";

import {
  useCancelPurchase,
  useDeletePurchase,
  usePurchase,
  useReopenPurchase,
  useVoidPayment,
} from "../hooks";
import type { Installment, Payment, PaylaterEvent, PurchaseDetail } from "../schema";
import { PaymentDialog, type PaymentTarget } from "./PaymentDialog";
import { PurchaseForm } from "./PurchaseForm";
import { ScheduleDialog } from "./ScheduleDialog";
import {
  InstallmentStatusBadge,
  longDate,
  PaidProgress,
  providerLabel,
  PurchaseStatusBadge,
  ROW_LIST,
} from "./paylater-bits";

const RECORD_AS_LABELS = {
  expense: "recorded as an expense",
  link: "linked to an expense you recorded",
  none: "not recorded as an expense",
} as const;

export function PurchaseDetailPage({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const purchase = usePurchase(purchaseId);
  const cancel = useCancelPurchase();
  const reopen = useReopenPurchase();
  const remove = useDeletePurchase();
  const voidPayment = useVoidPayment();

  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const [correcting, setCorrecting] = useState<Payment | null>(null);
  const [voiding, setVoiding] = useState<Payment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useSetBreadcrumbTitle(purchase.data?.description);

  if (purchase.isError) return <Error message={purchase.error.message} />;
  if (!purchase.data) return <DetailSkeleton />;

  const p = purchase.data;
  const open = p.status === "active" || p.status === "overdue";
  const payTarget = (installment?: Installment): PaymentTarget => ({
    accountId: p.account.id,
    scope: installment ? { installmentId: installment.id } : { purchaseId: p.id },
    label: installment ? `${p.description}, installment ${installment.number}` : p.description,
    owed: installment ? installment.remaining : p.remaining,
    categoryId: p.category?.id,
  });

  const actions: RowAction[] = [
    ...(p.status === "cancelled"
      ? [
          {
            label: "Reopen purchase",
            onSelect: () =>
              reopen.mutate(p.id, {
                onSuccess: (res) => toast.success(res.message),
                onError: (e) => toast.error(e.message),
              }),
          },
        ]
      : open
        ? [{ label: "Cancel purchase", onSelect: () => setCancelling(true), destructive: true }]
        : []),
    // Any payment, even a voided one, is history: such a purchase is cancelled, not deleted.
    ...(p.payments.length === 0
      ? [{ label: "Delete", onSelect: () => setDeleting(true), destructive: true }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="link" className="h-auto px-0">
        <Link href={routes.paylater.home}>
          <ArrowLeft className="size-4" aria-hidden />
          PayLater
        </Link>
      </Button>

      <PageHeader
        title={p.description}
        sprite="card"
        description={
          <>
            <Link
              href={routes.paylater.provider(p.account.id)}
              className="text-foreground font-medium underline decoration-2 underline-offset-4"
            >
              {providerLabel(p.account)}
            </Link>
            {` · bought ${longDate(p.purchase_date)}`}
            {p.merchant && ` at ${p.merchant}`}
          </>
        }
        actions={
          <>
            {open && (
              <Button onClick={() => setPaying(payTarget())}>
                <Plus className="size-4" aria-hidden />
                Record payment
              </Button>
            )}
            {p.status !== "cancelled" && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setScheduling(true)}>
                  <CalendarCog className="size-4" aria-hidden />
                  Edit schedule
                </Button>
              </>
            )}
            {actions.length > 0 && (
              <RowActionsMenu label="More actions for this purchase" actions={actions} />
            )}
          </>
        }
      />

      <Figures purchase={p} />

      <section aria-labelledby="pl-schedule" className="space-y-3">
        <h2 id="pl-schedule" className="text-lg">
          Installments
        </h2>
        <ol className={ROW_LIST}>
          {p.installments.map((i) => (
            <li
              key={i.id}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[2.5rem_8rem_minmax(0,1fr)_8rem_auto] sm:px-5"
            >
              <span className="font-pixel text-muted-foreground text-sm">#{i.number}</span>
              <div className="sm:order-none">
                <p className="font-pixel text-sm">{longDate(i.due_date)}</p>
                <InstallmentStatusBadge status={i.status} className="mt-1" />
              </div>
              <div className="col-span-2 col-start-2 text-xs sm:col-span-1 sm:col-start-auto">
                <p>
                  <MoneyDisplay value={i.paid} tone="neutral" /> paid of{" "}
                  <MoneyDisplay value={i.amount} tone="neutral" />
                </p>
                {i.paid_dates.length > 0 && (
                  <p className="text-muted-foreground">
                    Paid {i.paid_dates.map((d) => longDate(d)).join(", ")}
                  </p>
                )}
              </div>
              <MoneyDisplay
                value={i.remaining}
                tone={isZero(i.remaining) || i.status === "cancelled" ? "neutral" : "expense"}
                className="font-stat col-start-3 row-start-1 text-right text-2xl leading-none sm:col-start-auto sm:row-start-auto"
              />
              {i.status !== "paid" && i.status !== "cancelled" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-3 min-h-11 sm:col-span-1 sm:min-h-9"
                  onClick={() => setPaying(payTarget(i))}
                >
                  Pay
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="pl-payments" className="space-y-3">
          <h2 id="pl-payments" className="text-lg">
            Payments
          </h2>
          {p.payments.length === 0 ? (
            <p className="border-outline/40 text-muted-foreground border-2 border-dashed px-4 py-6 text-center text-sm">
              No payments yet.
            </p>
          ) : (
            <ul className={ROW_LIST}>
              {p.payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  onCorrect={() => setCorrecting(payment)}
                  onVoid={() => setVoiding(payment)}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="pl-history" className="space-y-3">
          <h2 id="pl-history" className="text-lg">
            History
          </h2>
          <ol className="pixel-panel space-y-3 p-4">
            {p.events.map((event) => (
              <EventLine key={event.id} event={event} />
            ))}
          </ol>
        </section>
      </div>

      <PurchaseForm open={editing} onOpenChange={setEditing} purchase={p} />
      <ScheduleDialog purchase={scheduling ? p : null} onOpenChange={setScheduling} />
      <PaymentDialog target={paying} onOpenChange={(next) => !next && setPaying(null)} />
      <PaymentDialog
        target={null}
        payment={correcting}
        onOpenChange={(next) => !next && setCorrecting(null)}
      />
      <ReasonDialog
        open={!!voiding}
        onOpenChange={(next) => !next && setVoiding(null)}
        title="Void this payment?"
        description={
          voiding?.record_as === "expense"
            ? "It stays in the history but stops counting, and its expense is deleted."
            : voiding?.record_as === "link"
              ? "It stays in the history but stops counting. The expense you recorded is kept, just unlinked."
              : "It stays in the history but stops counting toward what's paid."
        }
        required
        confirmLabel="Void payment"
        onConfirm={async (reason) => {
          const res = await voidPayment.mutateAsync({ id: voiding!.id, reason });
          toast.success(res.message);
        }}
      />
      <ReasonDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title="Cancel this purchase?"
        description="Use this when you won't pay the rest, e.g. the order was refunded. Its payments stay as history, and its unpaid installments stop counting. You can reopen it later."
        confirmLabel="Cancel purchase"
        onConfirm={async (reason) => {
          const res = await cancel.mutateAsync({ id: p.id, reason });
          toast.success(res.message);
        }}
      />
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={p.description}
        noun="purchase"
        onDelete={async () => {
          const res = await remove.mutateAsync(p.id);
          toast.success(res.message);
          router.push(routes.paylater.home);
        }}
      />
    </div>
  );
}

/** The status screen: what's left, how far along, and every figure of the plan. */
function Figures({ purchase: p }: { purchase: PurchaseDetail }) {
  return (
    <section
      aria-label="Balance"
      className="pixel-panel grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-8 md:p-6"
    >
      <div className="min-w-0 space-y-3">
        <PurchaseStatusBadge status={p.status} />
        <div>
          <p className="font-pixel text-muted-foreground text-sm">Remaining</p>
          <p className="font-stat text-5xl leading-none break-words sm:text-6xl">
            <MoneyDisplay
              value={p.remaining}
              tone={p.status === "cancelled" ? "neutral" : "expense"}
            />
          </p>
        </div>
        <PaidProgress percent={p.progress_percent} label={p.description} />
        <p className="text-muted-foreground text-sm">
          {p.paid_installments} of {p.installment_count} installments paid
          {p.next_due && (
            <>
              {" · next "}
              <MoneyDisplay value={p.next_due.amount} tone="neutral" /> on{" "}
              {longDate(p.next_due.due_date)}
            </>
          )}
        </p>
        {p.status === "cancelled" && (
          <p className="text-muted-foreground text-sm">
            Cancelled{p.cancelled_at ? ` ${formatDateTime(p.cancelled_at)}` : ""}
            {p.cancellation_reason ? `: ${p.cancellation_reason}` : "."}
          </p>
        )}
      </div>

      <dl className="divide-border grid divide-y-2 divide-dashed text-sm md:border-l-2 md:border-dashed md:pl-8">
        <Fact label="Purchase amount">
          <MoneyDisplay value={p.original_amount} tone="neutral" />
        </Fact>
        <Fact label="Down payment">
          <MoneyDisplay value={p.down_payment} tone="neutral" />
          {p.down_payment_recorded && (
            <span className="text-muted-foreground text-xs"> (expense)</span>
          )}
        </Fact>
        <Fact label="Financed">
          <MoneyDisplay value={p.financed_amount} tone="neutral" />
        </Fact>
        <Fact label="Fees">
          <MoneyDisplay value={p.fees} tone="neutral" />
        </Fact>
        <Fact label="Other charges">
          <MoneyDisplay value={p.other_charges} tone="neutral" />
        </Fact>
        <Fact label="All fees and charges">
          <MoneyDisplay value={p.total_charges} tone="neutral" />
          {p.interest_rate !== null && (
            <span className="text-muted-foreground text-xs"> ({p.interest_rate}% interest)</span>
          )}
        </Fact>
        <Fact label="Total to repay">
          <MoneyDisplay value={p.total_repayment} tone="neutral" />
        </Fact>
        <Fact label="Paid so far">
          <MoneyDisplay value={p.paid} tone="neutral" />
        </Fact>
        {p.category && <Fact label="Category">{p.category.name}</Fact>}
        {p.order_reference && <Fact label="Order number">{p.order_reference}</Fact>}
        {p.notes && (
          <div className="py-2">
            <dt className="font-pixel text-muted-foreground text-xs">Notes</dt>
            <dd className="mt-1 whitespace-pre-line">{p.notes}</dd>
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

function PaymentRow({
  payment: pay,
  onCorrect,
  onVoid,
}: {
  payment: Payment;
  onCorrect: () => void;
  onVoid: () => void;
}) {
  const voided = !!pay.voided_at;
  const here = pay.amount_here ?? pay.amount;
  const details = [
    pay.installment_numbers.length > 0 && `installment ${pay.installment_numbers.join(", ")}`,
    pay.payment_method?.name,
    RECORD_AS_LABELS[pay.record_as],
    pay.account?.name,
    pay.reference_number && `Ref ${pay.reference_number}`,
  ].filter(Boolean);

  return (
    <li className={cn("flex items-start gap-3 px-4 py-3 sm:px-5", voided && "opacity-60")}>
      <Sprite name={voided ? "alert" : "check"} size={20} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-pixel text-sm">{longDate(pay.payment_date)}</p>
          <MoneyDisplay
            value={here}
            tone="neutral"
            className={cn("font-stat text-2xl leading-none", voided && "line-through")}
          />
        </div>
        <p className="text-muted-foreground text-xs">{details.join(" · ")}</p>
        {pay.scope === "account" && (
          <p className="text-muted-foreground text-xs">
            Part of a <MoneyDisplay value={pay.amount} tone="neutral" /> bill payment
          </p>
        )}
        {pay.notes && <p className="mt-1 text-sm whitespace-pre-line">{pay.notes}</p>}
        {voided && (
          <p className="font-pixel text-expense mt-1 text-xs">
            Voided{pay.void_reason ? `: ${pay.void_reason}` : ""}
          </p>
        )}
      </div>
      {!voided && (
        <RowActionsMenu
          label={`Actions for the payment on ${longDate(pay.payment_date)}`}
          actions={[
            { label: "Correct", onSelect: onCorrect },
            { label: "Void", onSelect: onVoid, destructive: true },
          ]}
        />
      )}
    </li>
  );
}

const FIELD_LABELS: Record<string, string> = {
  description: "description",
  merchant: "store",
  order_reference: "order number",
  purchase_date: "purchase date",
  original_amount: "purchase amount",
  down_payment: "down payment",
  fees: "fees",
  other_charges: "other charges",
  interest_rate: "interest rate",
  amount: "amount",
  payment_date: "date",
  reference_number: "reference",
};

const asMoney = (value: unknown): Money | null => {
  const parsed = moneySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/** One history line, worded here from the numbers the API logged (as with insights, D21). */
function EventLine({ event }: { event: PaylaterEvent }) {
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
  )
    .map(([field, c]) =>
      field === "notes"
        ? "edited the notes"
        : `${FIELD_LABELS[field] ?? field} ${show(c.from)} → ${show(c.to)}`
    )
    .join("; ");
  const reason = typeof p.reason === "string" && p.reason ? `: ${p.reason}` : "";
  const total = p.total_repayment as { from?: unknown; to?: unknown } | undefined;
  const after = (p.after ?? []) as { number: number; due_date: string; amount: unknown }[];

  const text = {
    created: `Purchase recorded: ${money(p.total_repayment)} over ${String(p.installment_count ?? "")} installments`,
    updated: `Edited: ${changes}`,
    schedule_changed: `Schedule changed to ${after.length} installments, total ${show(total?.from)} → ${show(total?.to)}`,
    payment_recorded: `Payment of ${money(p.amount)} recorded; ${money(p.remaining)} left`,
    payment_corrected: `Payment corrected: ${changes}`,
    payment_voided: `Payment of ${money(p.amount)} voided${reason}`,
    cancelled: `Cancelled${reason}`,
    reopened: "Reopened",
  }[event.type];

  return (
    <li className="flex flex-col gap-0.5 border-l-2 border-dashed pl-3 text-sm">
      <span>{text}</span>
      {event.type === "schedule_changed" && after.length > 0 && (
        <span className="text-muted-foreground text-xs">
          {after.map((r) => `#${r.number} ${longDate(r.due_date)} ${money(r.amount)}`).join(" · ")}
        </span>
      )}
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
    <div className="space-y-6" aria-busy="true" aria-label="Loading purchase">
      <Skeleton className="h-16 w-72" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
