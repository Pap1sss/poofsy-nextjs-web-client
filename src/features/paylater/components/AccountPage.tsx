"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { isZero } from "@/lib/money";
import { cn } from "@/lib/utils/component";

import {
  useArchiveAccount,
  useDeleteAccount,
  usePaylaterAccount,
  useRestoreAccount,
} from "../hooks";
import { AccountForm } from "./AccountForm";
import { PaymentDialog, type PaymentTarget } from "./PaymentDialog";
import { PurchaseForm } from "./PurchaseForm";
import { longDate, providerLabel, PurchaseRow, ROW_LIST } from "./paylater-bits";

/** One provider account: its totals, a "pay the bill" action, its purchases and its payments. */
export function AccountPage({ accountId }: { accountId: string }) {
  const router = useRouter();
  const account = usePaylaterAccount(accountId);
  const archive = useArchiveAccount();
  const restore = useRestoreAccount();
  const remove = useDeleteAccount();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useSetBreadcrumbTitle(account.data ? providerLabel(account.data) : null);

  if (account.isError) return <Error message={account.error.message} />;
  if (!account.data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const a = account.data;
  const label = providerLabel(a);
  const notify = (res: { message: string }) => toast.success(res.message);
  const fail = (e: Error) => toast.error(e.message);

  return (
    <div className="space-y-6">
      <Button asChild variant="link" className="h-auto px-0">
        <Link href={routes.paylater.home}>
          <ArrowLeft className="size-4" aria-hidden />
          PayLater
        </Link>
      </Button>

      <PageHeader
        title={label}
        sprite="card"
        description={
          a.archived_at ? "Archived. Its purchases and payments are kept." : (a.notes ?? undefined)
        }
        actions={
          <>
            {!isZero(a.outstanding) && (
              <Button
                onClick={() =>
                  setPaying({
                    accountId: a.id,
                    scope: {},
                    label: `${label} bill`,
                    owed: a.outstanding,
                  })
                }
              >
                Pay bill
              </Button>
            )}
            {!a.archived_at && (
              <Button variant="outline" onClick={() => setAdding(true)}>
                <Plus className="size-4" aria-hidden />
                Record purchase
              </Button>
            )}
            <RowActionsMenu
              label={`More actions for ${label}`}
              actions={[
                { label: "Edit account", onSelect: () => setEditing(true) },
                a.archived_at
                  ? {
                      label: "Restore",
                      onSelect: () => restore.mutate(a.id, { onSuccess: notify, onError: fail }),
                    }
                  : {
                      label: "Archive",
                      onSelect: () => archive.mutate(a.id, { onSuccess: notify, onError: fail }),
                    },
                { label: "Delete", onSelect: () => setDeleting(true), destructive: true },
              ]}
            />
          </>
        }
      />

      <section
        aria-label={`${label} totals`}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatCard
          sprite="card"
          label="Outstanding"
          value={
            <MoneyDisplay
              value={a.outstanding}
              tone={isZero(a.outstanding) ? "neutral" : "expense"}
            />
          }
          hint={`${a.open_purchases_count} of ${a.purchases_count} purchases still running`}
        />
        <StatCard
          sprite="calendar"
          label="Due this month"
          value={<MoneyDisplay value={a.due_this_month} />}
          hint="Still unpaid"
        />
        <StatCard
          sprite="alert"
          label="Overdue"
          value={
            <MoneyDisplay value={a.overdue} tone={isZero(a.overdue) ? "neutral" : "expense"} />
          }
          hint="Past its due date"
        />
        <StatCard
          sprite="wallet"
          label="Available credit"
          value={
            a.available_credit ? (
              <MoneyDisplay value={a.available_credit} tone="neutral" />
            ) : (
              "Not set"
            )
          }
          hint={
            a.credit_limit ? (
              <>
                Limit <MoneyDisplay value={a.credit_limit} tone="neutral" />
                {a.available_is_estimate && " (estimated)"}
              </>
            ) : (
              "No credit limit entered"
            )
          }
        />
      </section>

      <section aria-labelledby="pl-account-purchases" className="space-y-3">
        <h2 id="pl-account-purchases" className="text-lg">
          Purchases
        </h2>
        {a.purchases.length === 0 ? (
          <EmptyState
            sprite="card"
            title="No purchases yet"
            description="Record what you bought with this account and its installments."
            action={
              !a.archived_at && <Button onClick={() => setAdding(true)}>Record purchase</Button>
            }
          />
        ) : (
          <ul className={ROW_LIST}>
            {a.purchases.map((p) => (
              <PurchaseRow key={p.id} purchase={p} showProvider={false} />
            ))}
          </ul>
        )}
      </section>

      {a.payments.length > 0 && (
        <section aria-labelledby="pl-account-payments" className="space-y-3">
          <h2 id="pl-account-payments" className="text-lg">
            Payments
          </h2>
          <ul className={ROW_LIST}>
            {a.payments.map((pay) => (
              <li
                key={pay.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 sm:px-5",
                  pay.voided_at && "opacity-60"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-pixel text-sm">{longDate(pay.payment_date)}</p>
                  <p className="text-muted-foreground text-xs">
                    {pay.scope === "account"
                      ? "Bill payment"
                      : pay.scope === "purchase"
                        ? "One purchase"
                        : "One installment"}
                    {pay.payment_method && ` · ${pay.payment_method.name}`}
                    {pay.voided_at && (
                      <span className="text-expense">
                        {" "}
                        · voided{pay.void_reason ? `: ${pay.void_reason}` : ""}
                      </span>
                    )}
                  </p>
                </div>
                <MoneyDisplay
                  value={pay.amount}
                  tone="neutral"
                  className={cn("font-stat text-2xl leading-none", pay.voided_at && "line-through")}
                />
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-xs">
            To correct or void a payment, open one of the purchases it paid.
          </p>
        </section>
      )}

      <AccountForm open={editing} onOpenChange={setEditing} account={a} />
      <PurchaseForm open={adding} onOpenChange={setAdding} accountId={a.id} />
      <PaymentDialog target={paying} onOpenChange={(next) => !next && setPaying(null)} />
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={label}
        noun="PayLater account"
        onDelete={async () => {
          const res = await remove.mutateAsync(a.id);
          toast.success(res.message);
          router.push(routes.paylater.home);
        }}
        onArchive={async () => {
          const res = await archive.mutateAsync(a.id);
          toast.success(res.message);
        }}
      />
    </div>
  );
}
