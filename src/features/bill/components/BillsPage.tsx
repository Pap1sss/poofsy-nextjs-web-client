"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { Sprite } from "@/components/pixel/sprites";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { BillStatus } from "../api";
import {
  useBills,
  useOccurrences,
  useSetBillActive,
  useSkipOccurrence,
  useUnskipOccurrence,
} from "../hooks";
import { describeRRule, type Bill, type BillOccurrence } from "../schema";
import { BillForm } from "./BillForm";
import { DeleteBillDialog } from "./DeleteBillDialog";
import { PayBillDialog } from "./PayBillDialog";

const longDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

// Pixel tab bar (same look as the shared segmented controls): the selected tab gets the cursor-yellow highlight.
const TAB_LIST = "pixel-box bg-muted h-11 gap-1 rounded-none p-1";
const TAB =
  "font-pixel rounded-none border-2 border-transparent px-3 data-[state=active]:border-outline data-[state=active]:bg-highlight data-[state=active]:text-highlight-foreground data-[state=active]:shadow-none focus-visible:outline-3 focus-visible:outline-highlight";

// Bill rows read like an RPG menu: the hovered or focused row shows the cursor colour.
const ROW_LIST = "pixel-panel divide-border divide-y-2 px-1 py-1";

const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  active: "Active bills",
  inactive: "Deactivated bills",
  all: "All bills",
};

export default function BillsPage() {
  const [form, setForm] = useState<{ open: boolean; bill: Bill | null }>({
    open: false,
    bill: null,
  });
  const [paying, setPaying] = useState<BillOccurrence | null>(null);
  const [deleting, setDeleting] = useState<Bill | null>(null);
  // Same query as the Missed tab's list, so this costs no extra request.
  const missedCount = useOccurrences("overdue").data?.length ?? 0;

  const openForm = (bill: Bill | null) => setForm({ open: true, bill });

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Bills"
        sprite="house"
        description="Recurring bills, what's due next, and what you've paid. Reminders come in the app and by email."
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus className="size-4" aria-hidden />
            Add bill
          </Button>
        }
      />

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className={TAB_LIST}>
          <TabsTrigger value="upcoming" className={TAB}>
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="missed" className={TAB}>
            Missed{missedCount > 0 && ` (${missedCount})`}
          </TabsTrigger>
          <TabsTrigger value="paid" className={TAB}>
            Paid
          </TabsTrigger>
          <TabsTrigger value="bills" className={TAB}>
            All bills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <OccurrenceList
            status="upcoming"
            onPay={setPaying}
            onAdd={() => openForm(null)}
            onEditBill={openForm}
          />
        </TabsContent>
        <TabsContent value="missed">
          <OccurrenceList
            status="overdue"
            onPay={setPaying}
            onAdd={() => openForm(null)}
            onEditBill={openForm}
          />
        </TabsContent>
        <TabsContent value="paid">
          <PaidList />
        </TabsContent>
        <TabsContent value="bills">
          <BillList onEdit={openForm} onDelete={setDeleting} onAdd={() => openForm(null)} />
        </TabsContent>
      </Tabs>

      <BillForm
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        bill={form.bill}
      />
      <PayBillDialog occurrence={paying} onOpenChange={(open) => !open && setPaying(null)} />
      <DeleteBillDialog bill={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/**
 * Unpaid bills by due date: "upcoming" from today on, or "overdue" (missed ones, oldest first, back to
 * each bill's start date) so a late payment can still be recorded or skipped.
 */
function OccurrenceList({
  status,
  onPay,
  onAdd,
  onEditBill,
}: {
  status: "upcoming" | "overdue";
  onPay: (occurrence: BillOccurrence) => void;
  onAdd: () => void;
  onEditBill: (bill: Bill | null) => void;
}) {
  const occurrences = useOccurrences(status);
  const bills = useBills("active");
  const skip = useSkipOccurrence();
  const unskip = useUnskipOccurrence();

  if (occurrences.isError) return <Error message={occurrences.error.message} />;
  if (occurrences.isLoading) return <ListSkeleton />;

  const rows = occurrences.data ?? [];

  if (rows.length === 0) {
    return status === "overdue" ? (
      <EmptyState
        title="No missed bills"
        description="Bills still unpaid after their due date show up here, so you can mark them as paid or skip them."
      />
    ) : (
      <EmptyState
        sprite="house"
        title="Nothing due"
        description="No bills yet. Add your internet or electricity bill to get reminders before it's due."
        action={<Button onClick={onAdd}>Add bill</Button>}
      />
    );
  }

  const onSkip = (occurrence: BillOccurrence) =>
    skip.mutate(occurrence.id, {
      onSuccess: (res) =>
        toast.success(res.message, {
          action: {
            label: "Undo",
            onClick: () =>
              unskip.mutate(occurrence.id, { onSuccess: (r) => toast.success(r.message) }),
          },
        }),
      onError: (error) => toast.error(error.message),
    });

  return (
    <ul className={ROW_LIST}>
      {rows.map((occurrence) => {
        const isOverdue = occurrence.status === "overdue";
        const bill = bills.data?.find((b) => b.id === occurrence.bill?.id) ?? null;

        return (
          <li
            key={occurrence.id}
            // Phones: a grid of name + amount, then the due date, then a full-width pay button.
            // From sm up it is one flex row in DOM order, and the grid placement is ignored.
            className="hover:bg-accent grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-4 sm:flex sm:flex-wrap sm:gap-x-4 sm:px-5"
          >
            <Sprite name={isOverdue ? "alert" : "house"} size={24} />
            <div className="col-span-2 col-start-2 row-start-2 flex items-baseline gap-2 sm:block sm:w-28 sm:shrink-0">
              <p className="font-pixel text-sm">{longDate(occurrence.due_date)}</p>
              {isOverdue ? (
                <p className="font-pixel text-expense text-xs">Overdue</p>
              ) : (
                <p className="font-pixel text-muted-foreground text-xs">Due</p>
              )}
            </div>
            <div className="col-start-2 row-start-1 min-w-0 sm:flex-1">
              <p className="font-pixel truncate text-base">{occurrence.bill?.name}</p>
              <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                {occurrence.bill?.category && (
                  <CategoryBadge
                    name={occurrence.bill.category.name}
                    color={occurrence.bill.category.color}
                  />
                )}
                {occurrence.bill?.account && <span>From {occurrence.bill.account.name}</span>}
              </div>
            </div>
            <MoneyDisplay
              value={occurrence.amount}
              className="col-start-3 row-start-1 self-start text-lg font-bold sm:self-auto"
            />
            <div className="col-span-2 col-start-2 row-start-3 flex items-center gap-1">
              <Button
                size="sm"
                className="min-h-11 flex-1 sm:min-h-9 sm:flex-none"
                onClick={() => onPay(occurrence)}
              >
                Mark as paid
              </Button>
              <RowActionsMenu
                label={`More actions for ${occurrence.bill?.name}`}
                actions={[
                  { label: "Skip this time", onSelect: () => onSkip(occurrence) },
                  ...(bill ? [{ label: "Edit bill", onSelect: () => onEditBill(bill) }] : []),
                ]}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PaidList() {
  const paid = useOccurrences("paid");

  if (paid.isError) return <Error message={paid.error.message} />;
  if (paid.isLoading) return <ListSkeleton />;
  if (!paid.data?.length) {
    return (
      <EmptyState
        title="No payments yet"
        description="Bills you mark as paid show up here, each with the expense it recorded."
      />
    );
  }

  return (
    <ul className={ROW_LIST}>
      {paid.data.map((occurrence) => (
        <li key={occurrence.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
          <Sprite name="check" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-pixel truncate text-base">{occurrence.bill?.name}</p>
            <p className="text-muted-foreground text-sm">
              <span className="font-pixel text-income">Paid</span>
              {". "}
              Due {longDate(occurrence.due_date)}
              {occurrence.paid_at && `, paid ${longDate(occurrence.paid_at.slice(0, 10))}`}
            </p>
          </div>
          <MoneyDisplay value={occurrence.amount} className="font-bold" />
        </li>
      ))}
    </ul>
  );
}

function BillList({
  onEdit,
  onDelete,
  onAdd,
}: {
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
  onAdd: () => void;
}) {
  const [status, setStatus] = useState<BillStatus>("active");
  const bills = useBills(status);
  const setActive = useSetBillActive();

  const toggle = (bill: Bill) =>
    setActive.mutate(
      { id: bill.id, active: !bill.active },
      { onSuccess: (res) => toast.success(res.message), onError: (e) => toast.error(e.message) }
    );

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={(v) => setStatus(v as BillStatus)}>
        <SelectTrigger className="w-52" aria-label="Show">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(BILL_STATUS_LABELS) as BillStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {BILL_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {bills.isError ? (
        <Error message={bills.error.message} />
      ) : bills.isLoading ? (
        <ListSkeleton />
      ) : !bills.data?.length ? (
        status === "inactive" ? (
          <EmptyState
            title="No deactivated bills"
            description="Bills you turn off keep their payment history here."
          />
        ) : (
          <EmptyState
            sprite="house"
            title="No bills yet"
            description="Add your internet or electricity bill to get reminders before it's due."
            action={<Button onClick={onAdd}>Add bill</Button>}
          />
        )
      ) : (
        <ul className={ROW_LIST}>
          {bills.data.map((bill) => (
            <li
              key={bill.id}
              className="hover:bg-accent flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5"
            >
              <Sprite name="receipt" size={24} />
              <div className="min-w-0 flex-1">
                <p className="font-pixel flex items-center gap-2 truncate text-base">
                  {bill.name}
                  {!bill.active && (
                    <span className="text-muted-foreground border-outline border-2 px-1.5 py-0.5 text-xs">
                      Deactivated
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground text-sm">
                  {describeRRule(bill.recurrence)}
                  {bill.next_due && bill.active
                    ? `. Next due ${longDate(bill.next_due.due_date)}${bill.next_due.status === "overdue" ? " (overdue)" : ""}`
                    : ""}
                </p>
              </div>
              {bill.category && (
                <CategoryBadge name={bill.category.name} color={bill.category.color} />
              )}
              <MoneyDisplay value={bill.amount} className="font-bold" />
              <RowActionsMenu
                label={`Actions for ${bill.name}`}
                actions={[
                  { label: "Edit", onSelect: () => onEdit(bill) },
                  {
                    label: bill.active ? "Deactivate" : "Reactivate",
                    onSelect: () => toggle(bill),
                  },
                  { label: "Delete", onSelect: () => onDelete(bill), destructive: true },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
