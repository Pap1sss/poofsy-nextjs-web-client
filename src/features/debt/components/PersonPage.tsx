"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { applyApiErrors } from "@/lib/utils/form";
import { cn } from "@/lib/utils/component";

import { DIRECTION_LABELS } from "../constant";
import { useDeletePerson, usePerson, useUpdatePerson } from "../hooks";
import {
  PersonFormSchema,
  type DebtDirection,
  type PersonDetail,
  type PersonFormValues,
  type PersonTotals,
} from "../schema";
import { DebtForm } from "./DebtForm";
import { DebtRow, DirectionBadge, directionTone, longDate, ROW_LIST } from "./debt-bits";

export function PersonPage({ personId }: { personId: string }) {
  const router = useRouter();
  const person = usePerson(personId);
  const remove = useDeletePerson();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useSetBreadcrumbTitle(person.data?.name);

  if (person.isError) return <Error message={person.error.message} />;
  if (!person.data) return <PersonSkeleton />;

  const p = person.data;

  return (
    <div className="space-y-6">
      <Button asChild variant="link" className="h-auto px-0">
        <Link href={routes.debts.home}>
          <ArrowLeft className="size-4" aria-hidden />
          All debts
        </Link>
      </Button>

      <PageHeader
        title={p.name}
        sprite="mascot"
        description={p.notes ?? "Everything between you two, both ways."}
        actions={
          <>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              Add debt
            </Button>
            <RowActionsMenu
              label={`More actions for ${p.name}`}
              actions={[
                { label: "Rename or add notes", onSelect: () => setRenaming(true) },
                ...(p.debts.length === 0
                  ? [{ label: "Delete", onSelect: () => setDeleting(true), destructive: true }]
                  : []),
              ]}
            />
          </>
        }
      />

      {/* Two separate ledgers: what they owe you never cancels what you owe them. */}
      <div className="grid gap-4 md:grid-cols-2">
        <DirectionTotals direction="receivable" totals={p.totals} />
        <DirectionTotals direction="payable" totals={p.totals} />
      </div>

      <section aria-labelledby="person-debts" className="space-y-3">
        <h2 id="person-debts" className="text-lg">
          Debts with {p.name}
        </h2>
        {p.debts.length === 0 ? (
          <EmptyState
            title="No debts yet"
            description={`Add one when you lend ${p.name} money or borrow some.`}
            action={<Button onClick={() => setAdding(true)}>Add debt</Button>}
          />
        ) : (
          <ul className={ROW_LIST}>
            {p.debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} showPerson={false} />
            ))}
          </ul>
        )}
      </section>

      {p.settlements.length > 0 && <PaymentHistory person={p} />}

      <DebtForm open={adding} onOpenChange={setAdding} debt={null} personId={p.id} />
      <PersonForm person={renaming ? p : null} onOpenChange={setRenaming} />
      <DeleteRecordDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={p.name}
        noun="person"
        onDelete={async () => {
          const res = await remove.mutateAsync(p.id);
          toast.success(res.message);
          router.push(routes.debts.home);
        }}
      />
    </div>
  );
}

function DirectionTotals({
  direction,
  totals,
}: {
  direction: DebtDirection;
  totals: PersonTotals;
}) {
  const t = totals[direction];

  return (
    <section
      aria-label={DIRECTION_LABELS[direction]}
      className={cn(
        "pixel-panel space-y-3 border-l-8 p-4 sm:p-5",
        direction === "receivable" ? "border-l-income" : "border-l-expense"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <DirectionBadge direction={direction} />
        <span className="text-muted-foreground text-xs">{t.open_count} still open</span>
      </div>
      <div>
        <p className="font-pixel text-muted-foreground text-sm">Remaining</p>
        <MoneyDisplay
          value={t.remaining}
          tone={directionTone(direction)}
          className="font-stat text-5xl leading-none"
        />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="font-pixel text-muted-foreground text-xs">Original</dt>
          <dd>
            <MoneyDisplay value={t.original} tone="neutral" />
          </dd>
        </div>
        <div>
          <dt className="font-pixel text-muted-foreground text-xs">Paid back</dt>
          <dd>
            <MoneyDisplay value={t.settled} tone="neutral" />
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** Every payment between you, newest first, across all their debts. */
function PaymentHistory({ person }: { person: PersonDetail }) {
  return (
    <section aria-labelledby="person-payments" className="space-y-3">
      <h2 id="person-payments" className="text-lg">
        Payment history
      </h2>
      <ul className={ROW_LIST}>
        {person.settlements.map((s) => {
          const voided = !!s.voided_at;

          return (
            <li key={s.id} className={cn("px-4 py-3 sm:px-5", voided && "opacity-60")}>
              <Link
                href={routes.debts.detail(s.debt.id)}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 hover:underline"
              >
                <span className="font-pixel w-28 shrink-0 text-sm">
                  {longDate(s.settlement_date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {s.debt.direction === "receivable" ? "Paid you" : "You paid"} ·{" "}
                  {s.debt.description}
                  {voided && <span className="text-expense font-pixel text-xs"> (voided)</span>}
                </span>
                <MoneyDisplay
                  value={s.amount}
                  tone={voided ? "neutral" : directionTone(s.debt.direction)}
                  className={cn("font-stat text-2xl leading-none", voided && "line-through")}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PersonForm({
  person,
  onOpenChange,
}: {
  person: PersonDetail | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <FormShell open={!!person} onOpenChange={onOpenChange} title="Edit person" size="md">
      {person && <PersonFormBody person={person} onDone={() => onOpenChange(false)} />}
    </FormShell>
  );
}

function PersonFormBody({ person, onDone }: { person: PersonDetail; onDone: () => void }) {
  const update = useUpdatePerson();
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(PersonFormSchema),
    defaultValues: { name: person.name, notes: person.notes ?? "" },
  });

  const onSubmit = (values: PersonFormValues) =>
    update.mutate(
      { id: person.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, ["name", "notes"]),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="person-name">Name</FieldLabel>
              <Input {...field} id="person-name" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="person-notes">Notes (optional)</FieldLabel>
              <Textarea {...field} id="person-notes" rows={2} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function PersonSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading person">
      <Skeleton className="h-16 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
