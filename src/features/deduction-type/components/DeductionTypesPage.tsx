"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { CurrencyInput } from "@/components/shared/currency-input";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Sprite } from "@/components/pixel/sprites";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ListStatusTabs, RowActionsMenu, type ListStatus } from "@/components/shared/list-controls";
import { applyApiErrors } from "@/lib/utils/form";

import {
  useArchiveDeductionType,
  useDeductionTypes,
  useDeleteDeductionType,
  useRestoreDeductionType,
  useSaveDeductionType,
} from "../hooks";
import {
  DeductionTypeFormSchema,
  type DeductionType,
  type DeductionTypeFormValues,
} from "../schema";

export default function DeductionTypesPage() {
  const [status, setStatus] = useState<ListStatus>("active");
  const types = useDeductionTypes(status);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeductionType | null>(null);
  const [deleting, setDeleting] = useState<DeductionType | null>(null);

  const remove = useDeleteDeductionType();
  const archive = useArchiveDeductionType();
  const restore = useRestoreDeductionType();

  const openForm = (type: DeductionType | null) => {
    setEditing(type);
    setFormOpen(true);
  };

  return (
    <div className="page-container max-w-3xl space-y-6">
      <PageHeader
        title="Deduction types"
        sprite="receipt"
        description="Payroll deductions that come off your gross pay, like SSS, PhilHealth and tax."
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus className="size-4" aria-hidden />
            Add deduction type
          </Button>
        }
      />

      <ListStatusTabs value={status} onValueChange={setStatus} />

      {types.isError ? (
        <Error message={types.error.message} />
      ) : types.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !types.data?.length ? (
        status === "active" ? (
          <EmptyState
            sprite="receipt"
            title="No deduction types yet"
            description="Add the deductions on your payslip so recording income takes a few taps."
            action={<Button onClick={() => openForm(null)}>Add deduction type</Button>}
          />
        ) : (
          <EmptyState
            title="Nothing archived"
            description="Archived deductions stay on old payslips and show up here."
          />
        )
      ) : (
        <ul className="pixel-panel divide-y p-2">
          {types.data.map((type) => (
            <li key={type.id} className="hover:bg-accent/60 flex items-center gap-4 px-3 py-2.5">
              <Sprite name="receipt" size={18} />
              <p className="font-pixel min-w-0 flex-1 truncate">{type.name}</p>
              {type.default_amount ? (
                <MoneyDisplay value={type.default_amount} tone="neutral" className="text-sm" />
              ) : (
                <span className="text-muted-foreground text-sm">No default</span>
              )}
              <RowActionsMenu
                label={`Actions for ${type.name}`}
                actions={
                  status === "active"
                    ? [
                        { label: "Edit", onSelect: () => openForm(type) },
                        {
                          label: "Archive",
                          onSelect: () =>
                            archive.mutate(type.id, {
                              onSuccess: (res) => toast.success(res.message),
                            }),
                        },
                        { label: "Delete", onSelect: () => setDeleting(type), destructive: true },
                      ]
                    : [
                        {
                          label: "Restore",
                          onSelect: () =>
                            restore.mutate(type.id, {
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

      <FormShell
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Edit deduction type" : "Add deduction type"}
      >
        {formOpen && (
          <DeductionTypeForm
            key={editing?.id ?? "new"}
            type={editing}
            onDone={() => setFormOpen(false)}
          />
        )}
      </FormShell>

      {deleting && (
        <DeleteRecordDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          name={deleting.name}
          noun="deduction type"
          onDelete={() => remove.mutateAsync(deleting.id).then((res) => toast.success(res.message))}
          onArchive={() =>
            archive.mutateAsync(deleting.id).then((res) => toast.success(res.message))
          }
        />
      )}
    </div>
  );
}

function DeductionTypeForm({ type, onDone }: { type: DeductionType | null; onDone: () => void }) {
  const save = useSaveDeductionType();
  const form = useForm<DeductionTypeFormValues>({
    resolver: zodResolver(DeductionTypeFormSchema),
    defaultValues: { name: type?.name ?? "", default_amount: type?.default_amount?.amount ?? "" },
  });

  const onSubmit = (values: DeductionTypeFormValues) =>
    save.mutate(
      { id: type?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, ["name", "default_amount"]),
      }
    );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="deduction-type-name">Name</FieldLabel>
              <Input
                {...field}
                id="deduction-type-name"
                placeholder="SSS"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="default_amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="deduction-type-amount">Usual amount</FieldLabel>
              <CurrencyInput
                id="deduction-type-amount"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Leave blank if it changes every payday"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Optional. Pre-fills this line when you record a payslip.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        {form.formState.errors.root?.message && (
          <Alert variant="destructive">
            <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : type ? "Save changes" : "Add deduction type"}
        </Button>
      </FieldGroup>
    </form>
  );
}
