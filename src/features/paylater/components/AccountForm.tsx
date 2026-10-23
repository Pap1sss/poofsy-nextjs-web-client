"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { segmentClass } from "@/components/ui/segments";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/utils/form";

import { PROVIDER_PRESETS } from "../constant";
import { useSaveAccount } from "../hooks";
import { AccountFormSchema, type AccountFormValues, type PaylaterAccount } from "../schema";

const FIELDS = [
  "provider_name",
  "nickname",
  "credit_limit",
  "available_credit",
  "due_day",
  "notes",
] as const;

type AccountFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The account to edit; null adds one. */
  account: PaylaterAccount | null;
  onSaved?: (id: string) => void;
};

export function AccountForm({ open, onOpenChange, account, onSaved }: AccountFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={account ? "Edit PayLater account" : "Add a PayLater account"}
      size="lg"
    >
      {open && (
        <AccountFormBody
          key={account?.id ?? "new"}
          account={account}
          onDone={(id) => {
            onOpenChange(false);
            onSaved?.(id);
          }}
        />
      )}
    </FormShell>
  );
}

function AccountFormBody({
  account,
  onDone,
}: {
  account: PaylaterAccount | null;
  onDone: (id: string) => void;
}) {
  const save = useSaveAccount();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      provider_name: account?.provider_name ?? "",
      nickname: account?.nickname ?? "",
      credit_limit: account?.credit_limit?.amount ?? "",
      // An estimate isn't something the user entered, so the box starts empty.
      available_credit:
        account && !account.available_is_estimate ? (account.available_credit?.amount ?? "") : "",
      due_day: account?.due_day ? String(account.due_day) : "",
      notes: account?.notes ?? "",
    },
  });
  const providerName = useWatch({ control: form.control, name: "provider_name" });

  const onSubmit = (values: AccountFormValues) =>
    save.mutate(
      { id: account?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone(res.data.id);
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <p className="text-muted-foreground text-sm">
          Poofsy only tracks what you type in. Never enter your provider password or OTP here.
        </p>

        <Controller
          name="provider_name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="paylater-provider">Provider</FieldLabel>
              <div role="group" aria-label="Common providers" className="flex flex-wrap gap-1">
                {PROVIDER_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={providerName === preset}
                    onClick={() => form.setValue("provider_name", preset, { shouldValidate: true })}
                    className={`${segmentClass} border-outline/40 h-9`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                {...field}
                id="paylater-provider"
                placeholder="Or type any provider"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="nickname"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="paylater-nickname">Nickname (optional)</FieldLabel>
              <Input
                {...field}
                id="paylater-nickname"
                placeholder="e.g. Main account"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="credit_limit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="paylater-limit">Credit limit (optional)</FieldLabel>
                <CurrencyInput
                  id="paylater-limit"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0.00"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="available_credit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="paylater-available">Available credit (optional)</FieldLabel>
                <CurrencyInput
                  id="paylater-available"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0.00"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>As your provider&apos;s app shows it.</FieldDescription>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="due_day"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="paylater-due-day">Pay date (optional)</FieldLabel>
              <Input
                {...field}
                id="paylater-due-day"
                type="number"
                min={1}
                max={31}
                inputMode="numeric"
                placeholder="e.g. 5"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  The day of the month your bill is due. New purchases start their schedule on it.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="paylater-notes">Notes (optional)</FieldLabel>
              <Textarea {...field} id="paylater-notes" rows={2} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : account ? "Save changes" : "Add account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
