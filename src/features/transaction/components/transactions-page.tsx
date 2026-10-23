"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Download,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routes } from "@/config/routes";

import { PER_PAGE_OPTIONS, TYPE_LABELS } from "../constant";
import { useDeleteTransaction, useExportTransactions, useTransactions } from "../hooks";
import type { Transaction } from "../schema";
import { useTransactionFilters } from "../use-transaction-filters";
import { TransactionAmount } from "./transaction-amount";
import { TransactionFilters } from "./transaction-filters";
import { TransactionForm } from "./transaction-form";

const dateLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );

// Inventory icons: each kind of money movement has its own item sprite.
const TYPE_SPRITE: Record<Transaction["type"], SpriteName> = {
  income: "coin",
  expense: "receipt",
  transfer: "swap",
  adjustment: "alert",
};

function TypeSprite({ transaction }: { transaction: Transaction }) {
  return (
    <Sprite name={TYPE_SPRITE[transaction.type]} size={18} title={TYPE_LABELS[transaction.type]} />
  );
}

/** "Wallet", or "Wallet to MariBank" for a transfer. */
function AccountCell({ transaction }: { transaction: Transaction }) {
  if (!transaction.to_account) {
    if (transaction.account) return <>{transaction.account.name}</>;
    // An expense with no account is track-only: it moved no balance.
    return (
      <span className="text-muted-foreground">
        {transaction.type === "expense" ? "Track only" : "—"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      {transaction.account?.name}
      <ArrowRight className="text-muted-foreground size-3.5" aria-label="to" />
      {transaction.to_account.name}
    </span>
  );
}

function CategoryCell({ transaction }: { transaction: Transaction }) {
  if (transaction.category) {
    return <CategoryBadge name={transaction.category.name} color={transaction.category.color} />;
  }
  return <span className="text-muted-foreground text-xs">{TYPE_LABELS[transaction.type]}</span>;
}

type RowActionsProps = {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
};

/** Income from a payslip is edited on the Income page, and debt money on the Debts page, where their records live. */
function RowActions({ transaction, onEdit, onDelete }: RowActionsProps) {
  if (transaction.from_income_record) {
    return (
      <Button asChild variant="link" size="sm" className="h-auto px-0">
        <Link href={routes.income.home}>Edit on Income page</Link>
      </Button>
    );
  }

  if (transaction.from_debt) {
    return (
      <Button asChild variant="link" size="sm" className="h-auto px-0">
        <Link href={routes.debts.home}>Edit on Debts page</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${transaction.description}`}
          className="size-11 md:size-9"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(transaction)}>
          <Pencil aria-hidden />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(transaction)}>
          <Trash2 aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ReceiptMark({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Paperclip
      className="text-muted-foreground size-3.5 shrink-0"
      aria-label={count === 1 ? "1 receipt" : `${count} receipts`}
    />
  );
}

export function TransactionsPage() {
  const filterState = useTransactionFilters();
  const { filters, update, isFiltered } = filterState;

  const list = useTransactions(filters);
  const exportCsv = useExportTransactions();
  const remove = useDeleteTransaction();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: (res) => {
        toast.success(res.message);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleting(null);
      },
    });
  };

  return (
    <div className="page-container mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Transactions"
        sprite="receipt"
        description="Every expense, income, transfer and balance adjustment, newest first."
        actions={
          <>
            <Button
              variant="outline"
              disabled={exportCsv.isPending}
              onClick={() =>
                exportCsv.mutate(filters, { onError: (error) => toast.error(error.message) })
              }
            >
              <Download aria-hidden />
              {exportCsv.isPending ? "Exporting..." : "Export CSV"}
            </Button>
            <Button onClick={openNew}>
              <Plus aria-hidden />
              Add transaction
            </Button>
          </>
        }
      />

      <TransactionFilters {...filterState} />

      {list.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Couldn&apos;t load transactions: {list.error.message}</AlertDescription>
        </Alert>
      ) : list.isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nothing matches these filters"
            description="Try a wider date range or clear the filters."
            action={
              <Button variant="outline" onClick={filterState.clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add your first expense to start tracking where your money goes."
            action={
              <Button onClick={openNew}>
                <Plus aria-hidden />
                Add transaction
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* Table from md up. */}
          <div className="pixel-panel hidden px-2 py-1 md:block">
            <Table>
              <TableHeader>
                <TableRow className="font-pixel">
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Payment method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id} className="h-12">
                    <TableCell className="text-muted-foreground tabular-nums">
                      {dateLabel(t.transaction_date)}
                    </TableCell>
                    <TableCell className="max-w-72">
                      <div className="flex items-center gap-2">
                        <TypeSprite transaction={t} />
                        <span className="truncate font-medium">{t.description}</span>
                        <ReceiptMark count={t.attachments_count} />
                      </div>
                      {t.notes && (
                        <p className="text-muted-foreground truncate text-xs">{t.notes}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <CategoryCell transaction={t} />
                    </TableCell>
                    <TableCell>
                      <AccountCell transaction={t} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.payment_method?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <TransactionAmount transaction={t} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions transaction={t} onEdit={openEdit} onDelete={setDeleting} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Stacked cards below md (plan §6). */}
          <ul className="space-y-2 md:hidden">
            {rows.map((t) => (
              <li key={t.id} className="pixel-box bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <TypeSprite transaction={t} />
                      <span className="truncate font-medium">{t.description}</span>
                      <ReceiptMark count={t.attachments_count} />
                    </div>
                    <p className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                      <span className="tabular-nums">{dateLabel(t.transaction_date)}</span>
                      <AccountCell transaction={t} />
                    </p>
                  </div>
                  <TransactionAmount transaction={t} className="shrink-0 font-semibold" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <CategoryCell transaction={t} />
                    {t.payment_method && (
                      <span className="text-muted-foreground text-xs">{t.payment_method.name}</span>
                    )}
                  </div>
                  <RowActions transaction={t} onEdit={openEdit} onDelete={setDeleting} />
                </div>
                {t.notes && <p className="text-muted-foreground mt-2 text-xs">{t.notes}</p>}
              </li>
            ))}
          </ul>

          {meta && (
            <nav
              aria-label="Pagination"
              className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row"
            >
              <p className="text-muted-foreground tabular-nums">
                Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(filters.per_page ?? 25)}
                  onValueChange={(value) => update({ per_page: Number(value) })}
                >
                  <SelectTrigger className="w-32" aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} per page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={meta.current_page <= 1 || list.isFetching}
                  onClick={() => update({ page: meta.current_page - 1 })}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground tabular-nums">
                  {meta.current_page} / {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  disabled={meta.current_page >= meta.last_page || list.isFetching}
                  onClick={() => update({ page: meta.current_page + 1 })}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} transaction={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        showTrigger={false}
        title="Delete this transaction?"
        description={`“${deleting?.description ?? ""}” will be removed and your account balances will update to match. You can't undo this.`}
        confirmLabel="Delete transaction"
        confirmVariant="destructive"
        isPending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
