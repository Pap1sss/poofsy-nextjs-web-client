"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { Autocomplete } from "@/components/shared/autocomplete";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Sprite } from "@/components/pixel/sprites";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ListStatusTabs, RowActionsMenu, type ListStatus } from "@/components/shared/list-controls";
import { useAccounts } from "@/features/account/hooks";
import { applyApiErrors } from "@/lib/utils/form";

import {
  useArchivePaymentMethod,
  useDeletePaymentMethod,
  usePaymentMethods,
  useRestorePaymentMethod,
  useSavePaymentMethod,
} from "../hooks";
import {
  NO_ACCOUNT,
  PaymentMethodFormSchema,
  type PaymentMethod,
  type PaymentMethodFormValues,
} from "../schema";

export default function PaymentMethodsPage() {
  const [status, setStatus] = useState<ListStatus>("active");
  const methods = usePaymentMethods(status);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState<PaymentMethod | null>(null);

  const remove = useDeletePaymentMethod();
  const archive = useArchivePaymentMethod();
  const restore = useRestorePaymentMethod();

  const openForm = (method: PaymentMethod | null) => {
    setEditing(method);
    setFormOpen(true);
  };

  return (
    <div className="page-container max-w-3xl space-y-6">
      <PageHeader
        title="Payment methods"
        sprite="card"
        description="How you pay, so you can filter spending by Cash, GCash, cards and more."
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus className="size-4" aria-hidden />
            Add payment method
          </Button>
        }
      />

      <ListStatusTabs value={status} onValueChange={setStatus} />

      {methods.isError ? (
        <Error message={methods.error.message} />
      ) : methods.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !methods.data?.length ? (
        status === "active" ? (
          <EmptyState
            sprite="card"
            title="No payment methods yet"
            description="Add the ways you pay, like Cash or GCash, to tag them on expenses."
            action={<Button onClick={() => openForm(null)}>Add payment method</Button>}
          />
        ) : (
          <EmptyState
            title="Nothing archived"
            description="Archived payment methods keep their history and show up here."
          />
        )
      ) : (
        <ul className="pixel-panel divide-y p-2">
          {methods.data.map((method) => (
            <li key={method.id} className="hover:bg-accent/60 flex items-center gap-4 px-3 py-2.5">
              <Sprite name="card" size={18} />
              <div className="min-w-0 flex-1">
                <p className="font-pixel truncate">{method.name}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {method.account ? `Paid from ${method.account.name}` : "Not tied to an account"}
                </p>
              </div>
              <RowActionsMenu
                label={`Actions for ${method.name}`}
                actions={
                  status === "active"
                    ? [
                        { label: "Edit", onSelect: () => openForm(method) },
                        {
                          label: "Archive",
                          onSelect: () =>
                            archive.mutate(method.id, {
                              onSuccess: (res) => toast.success(res.message),
                            }),
                        },
                        { label: "Delete", onSelect: () => setDeleting(method), destructive: true },
                      ]
                    : [
                        {
                          label: "Restore",
                          onSelect: () =>
                            restore.mutate(method.id, {
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
        title={editing ? "Edit payment method" : "Add payment method"}
      >
        {formOpen && (
          <PaymentMethodForm
            key={editing?.id ?? "new"}
            method={editing}
            onDone={() => setFormOpen(false)}
          />
        )}
      </FormShell>

      {deleting && (
        <DeleteRecordDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          name={deleting.name}
          noun="payment method"
          onDelete={() => remove.mutateAsync(deleting.id).then((res) => toast.success(res.message))}
          onArchive={() =>
            archive.mutateAsync(deleting.id).then((res) => toast.success(res.message))
          }
        />
      )}
    </div>
  );
}

function PaymentMethodForm({
  method,
  onDone,
}: {
  method: PaymentMethod | null;
  onDone: () => void;
}) {
  const save = useSavePaymentMethod();
  const accounts = useAccounts("active");

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(PaymentMethodFormSchema),
    defaultValues: { name: method?.name ?? "", account_id: method?.account?.id ?? NO_ACCOUNT },
  });

  const onSubmit = (values: PaymentMethodFormValues) =>
    save.mutate(
      { id: method?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, ["name", "account_id"]),
      }
    );

  // An archived linked account isn't in the active list; keep it selectable so editing doesn't drop it.
  const accountOptions = [
    ...(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    ...(method?.account && !accounts.data?.some((a) => a.id === method.account?.id)
      ? [{ value: method.account.id, label: method.account.name }]
      : []),
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="payment-method-name">Name</FieldLabel>
              <Input
                {...field}
                id="payment-method-name"
                placeholder="GCash"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="account_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="payment-method-account">Linked account</FieldLabel>
              {/* The form keeps NO_ACCOUNT for "none"; the picker's empty value is "". */}
              <Autocomplete
                id="payment-method-account"
                value={field.value === NO_ACCOUNT ? "" : field.value}
                onChange={(id) => field.onChange(id || NO_ACCOUNT)}
                onBlur={field.onBlur}
                options={accountOptions}
                loading={accounts.isLoading}
                placeholder="No linked account"
                emptyMessage="No accounts match."
                invalid={fieldState.invalid}
                clearable
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Optional. The account this method usually draws from.
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
          {save.isPending ? "Saving..." : method ? "Save changes" : "Add payment method"}
        </Button>
      </FieldGroup>
    </form>
  );
}
