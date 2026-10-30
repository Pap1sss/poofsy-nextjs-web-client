"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import Link from "next/link";

import { Sprite } from "@/components/pixel/sprites";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { HideAmountsButton } from "@/components/shared/hide-amounts-button";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useHidden } from "@/lib/privacy";

import { ACCOUNT_SPRITE } from "../constant";
import { useAccounts, useArchiveAccount, useDeleteAccount, useRestoreAccount } from "../hooks";
import { ACCOUNT_TYPE_LABELS, type Account } from "../schema";
import { AccountForm } from "./AccountForm";
import { ListStatusTabs, RowActionsMenu, type ListStatus } from "@/components/shared/list-controls";
import { ReconcileDialog } from "./ReconcileDialog";

export default function AccountsPage() {
  const [status, setStatus] = useState<ListStatus>("active");
  const accounts = useAccounts(status);
  const balancesHidden = useHidden("accounts");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [reconciling, setReconciling] = useState<Account | null>(null);

  const remove = useDeleteAccount();
  const archive = useArchiveAccount();
  const restore = useRestoreAccount();

  const openForm = (account: Account | null) => {
    setEditing(account);
    setFormOpen(true);
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Accounts & wallets"
        sprite="wallet"
        description="Cash, bank accounts and e-wallets. Balances update from every transaction you record."
        actions={
          <>
            <HideAmountsButton area="accounts" what="balances" className="size-10" />
            <Button onClick={() => openForm(null)}>
              <Plus className="size-4" aria-hidden />
              Add account
            </Button>
          </>
        }
      />

      <ListStatusTabs value={status} onValueChange={setStatus} />

      {accounts.isError ? (
        <Error message={accounts.error.message} />
      ) : accounts.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !accounts.data?.length ? (
        status === "active" ? (
          <EmptyState
            sprite="wallet"
            title="No accounts yet"
            description="Add where your money sits, like a wallet, bank account or GCash, so every transaction has a place to come from."
            action={<Button onClick={() => openForm(null)}>Add account</Button>}
          />
        ) : (
          <EmptyState
            title="Nothing archived"
            description="Accounts you archive keep their history and show up here."
          />
        )
      ) : (
        <ul className="pixel-panel divide-y-2 divide-dashed px-2 py-1">
          {accounts.data.map((account) => (
            <li key={account.id} className="flex items-center gap-4 px-2 py-4 sm:px-4">
              {/* The whole row opens the account's own page; the actions menu stays separate. */}
              <Link
                href={routes.account(account.id)}
                className="group flex min-w-0 flex-1 items-center gap-4"
              >
                <Sprite name={ACCOUNT_SPRITE[account.type]} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="font-pixel truncate text-base group-hover:underline">
                    {account.name}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {ACCOUNT_TYPE_LABELS[account.type]}
                    {account.notes ? `, ${account.notes}` : ""}
                  </p>
                </div>
                <MoneyDisplay
                  value={account.current_balance}
                  hidden={balancesHidden}
                  className="font-stat text-2xl sm:text-3xl"
                />
              </Link>
              <RowActionsMenu
                label={`Actions for ${account.name}`}
                actions={
                  status === "active"
                    ? [
                        { label: "Edit", onSelect: () => openForm(account) },
                        { label: "Reconcile", onSelect: () => setReconciling(account) },
                        {
                          label: "Archive",
                          onSelect: () =>
                            archive.mutate(account.id, {
                              onSuccess: (res) => toast.success(res.message),
                            }),
                        },
                        {
                          label: "Delete",
                          onSelect: () => setDeleting(account),
                          destructive: true,
                        },
                      ]
                    : [
                        {
                          label: "Restore",
                          onSelect: () =>
                            restore.mutate(account.id, {
                              onSuccess: (res) => toast.success(res.message),
                            }),
                        },
                      ]
                }
              />
            </li>
          ))}
        </ul>
      )}

      <AccountForm open={formOpen} onOpenChange={setFormOpen} account={editing} />
      <ReconcileDialog
        account={reconciling}
        onOpenChange={(open) => !open && setReconciling(null)}
      />
      {deleting && (
        <DeleteRecordDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          name={deleting.name}
          noun="account"
          onDelete={() => remove.mutateAsync(deleting.id).then((res) => toast.success(res.message))}
          onArchive={() =>
            archive.mutateAsync(deleting.id).then((res) => toast.success(res.message))
          }
        />
      )}
    </div>
  );
}
