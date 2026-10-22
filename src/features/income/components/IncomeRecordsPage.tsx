"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Autocomplete } from "@/components/shared/autocomplete";
import { EmptyState } from "@/components/shared/empty-state";
import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import TabLinks from "@/components/tab-links";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { incomeTabLinks } from "../constant";
import { formatIsoDate } from "../dates";
import { useDeleteIncomeRecord, useIncomeRecords, useRecentPayPeriods } from "../hooks";
import type { IncomeRecord } from "../schema";
import { IncomeRecordForm } from "./IncomeRecordForm";

export default function IncomeRecordsPage() {
  const [page, setPage] = useState(1);
  const [periodId, setPeriodId] = useState(""); // "" = all cutoffs
  const [editing, setEditing] = useState<IncomeRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<IncomeRecord | null>(null);

  const periods = useRecentPayPeriods();
  const records = useIncomeRecords(page, periodId || undefined);
  const { mutate: remove, isPending: isDeleting } = useDeleteIncomeRecord();

  const openForm = (record: IncomeRecord | null) => {
    setEditing(record);
    setFormOpen(true);
  };

  const meta = records.data?.meta;
  const rows = records.data?.data ?? [];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Income"
        sprite="coin"
        description="Each payslip you record adds its net pay to the account it went into."
        actions={
          <Button onClick={() => openForm(null)} className="min-h-11 sm:min-h-9">
            <Plus className="size-4" aria-hidden />
            Record income
          </Button>
        }
      />

      <TabLinks tabLinks={incomeTabLinks} resourceId="" />

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="income-period" className="font-pixel text-muted-foreground text-sm">
          Cutoff
        </label>
        <Autocomplete
          id="income-period"
          className="w-64 max-w-full"
          value={periodId}
          onChange={(value) => {
            setPeriodId(value);
            setPage(1);
          }}
          options={(periods.data ?? []).map((period) => ({
            value: period.id,
            label: period.label,
          }))}
          loading={periods.isLoading}
          placeholder="All cutoffs"
          emptyMessage="No cutoffs match."
          clearable
        />
      </div>

      {records.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn&apos;t load your income: {records.error.message}
          </AlertDescription>
        </Alert>
      ) : records.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          sprite="coin"
          title={!periodId ? "No income recorded yet" : "No income in this cutoff"}
          description="Record your payslip on payday so each cutoff budget works from what you actually received."
          action={
            <Button variant="outline" onClick={() => openForm(null)}>
              Record income
            </Button>
          }
        />
      ) : (
        <>
          {/* Phones: one inventory row per payslip. */}
          <ul className="space-y-3 md:hidden">
            {rows.map((record) => (
              <li key={record.id} className="pixel-box bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Sprite name="coin" size={20} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-pixel truncate">{record.income_source?.name ?? "Income"}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatIsoDate(record.pay_date)}, into {record.account?.name}
                    </p>
                  </div>
                  <MoneyDisplay
                    value={record.net}
                    tone="income"
                    className="text-lg font-semibold"
                  />
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Gross <MoneyDisplay value={record.gross} tone="neutral" />, deductions{" "}
                  <MoneyDisplay value={record.deductions_total} tone="neutral" />
                </p>
                <RowActions record={record} onEdit={openForm} onDelete={setDeleting} />
              </li>
            ))}
          </ul>

          <div className="pixel-panel hidden p-2 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Paid into</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net pay</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((record) => (
                  <TableRow key={record.id} className="h-12">
                    <TableCell>{formatIsoDate(record.pay_date)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Sprite name="coin" size={16} />
                        {record.income_source?.name ?? "Income"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.account?.name}</TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={record.gross} tone="neutral" />
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={record.deductions_total} tone="neutral" />
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay value={record.net} tone="income" className="font-semibold" />
                    </TableCell>
                    <TableCell>
                      <RowActions record={record} onEdit={openForm} onDelete={setDeleting} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {meta && meta.last_page > 1 && (
            <nav
              aria-label="Income pages"
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-pixel text-muted-foreground">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage(meta.current_page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage(meta.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      <IncomeRecordForm open={formOpen} onOpenChange={setFormOpen} record={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        showTrigger={false}
        title="Delete this payslip?"
        description="Its net pay is also removed from the account balance and from this cutoff's income. You can't undo this."
        confirmLabel="Delete payslip"
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={() =>
          deleting &&
          remove(deleting.id, {
            onSuccess: (res) => {
              toast.success(res.message);
              setDeleting(null);
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </div>
  );
}

function RowActions({
  record,
  onEdit,
  onDelete,
}: {
  record: IncomeRecord;
  onEdit: (record: IncomeRecord) => void;
  onDelete: (record: IncomeRecord) => void;
}) {
  const label = `${record.income_source?.name ?? "income"} on ${formatIsoDate(record.pay_date)}`;

  return (
    <div className="mt-2 flex justify-end gap-1 md:mt-0">
      <Button
        variant="ghost"
        size="icon"
        className="size-11 md:size-9"
        aria-label={`Edit ${label}`}
        onClick={() => onEdit(record)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-expense size-11 md:size-9"
        aria-label={`Delete ${label}`}
        onClick={() => onDelete(record)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
