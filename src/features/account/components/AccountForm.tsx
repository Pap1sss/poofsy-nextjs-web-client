"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/utils/form";

import { useSaveAccount } from "../hooks";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  AccountFormSchema,
  type Account,
  type AccountFormValues,
} from "../schema";

const FIELDS = ["name", "type", "starting_balance", "notes"] as const;

const defaults = (account?: Account | null): AccountFormValues => ({
  name: account?.name ?? "",
  type: account?.type ?? "bank",
  starting_balance: account?.starting_balance.amount.replace(/^-/, "") ?? "",
  below_zero: account?.starting_balance.amount.startsWith("-") ?? false,
  notes: account?.notes ?? "",
});

type AccountFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to add a new account. */
  account: Account | null;
};

export function AccountForm({ open, onOpenChange, account }: AccountFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={account ? "Edit account" : "Add account"}
    >
      {/* Remount per account so the form starts from that account's values. */}
      {open && (
        <AccountFormBody
          key={account?.id ?? "new"}
          account={account}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function AccountFormBody({ account, onDone }: { account: Account | null; onDone: () => void }) {
  const save = useSaveAccount();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: defaults(account),
  });

  const onSubmit = (values: AccountFormValues) =>
    save.mutate(
      { id: account?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
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
              <FieldLabel htmlFor="account-name">Name</FieldLabel>
              <Input
                {...field}
                id="account-name"
                placeholder="BPI Savings, GCash, Wallet"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-type">Type</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="account-type"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ACCOUNT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="starting_balance"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-starting-balance">Starting balance</FieldLabel>
              <CurrencyInput
                id="account-starting-balance"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  What the account held before you started tracking it here. Changing it later
                  recalculates the balance.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name="below_zero"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="account-below-zero"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
              <FieldLabel htmlFor="account-below-zero" className="font-normal">
                This account starts below zero, like a credit card balance or a loan
              </FieldLabel>
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="account-notes">Notes</FieldLabel>
              <Textarea {...field} id="account-notes" rows={3} aria-invalid={fieldState.invalid} />
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
