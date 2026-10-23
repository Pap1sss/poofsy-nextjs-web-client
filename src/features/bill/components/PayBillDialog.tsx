"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { TRACK_ONLY } from "@/features/transaction/schema";
import { useFormatMoney } from "@/components/shared/money-display";
import { applyApiErrors } from "@/lib/utils/form";
import { generateUuid } from "@/lib/utils/string";

import { useBillAccounts, usePayBill, usePaymentMethods } from "../hooks";
import { PayFormSchema, type BillOccurrence, type PayFormValues } from "../schema";

const FIELDS = ["account_id", "amount", "paid_on", "payment_method_id"] as const;

const todayIn = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());

const longDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

/** Marks one occurrence as paid. Null closes it. */
export function PayBillDialog({
  occurrence,
  onOpenChange,
}: {
  occurrence: BillOccurrence | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <FormShell
      open={!!occurrence}
      onOpenChange={onOpenChange}
      title={occurrence?.bill ? `Pay ${occurrence.bill.name}` : "Pay bill"}
    >
      {occurrence?.bill && (
        <PayBody key={occurrence.id} occurrence={occurrence} onDone={() => onOpenChange(false)} />
      )}
    </FormShell>
  );
}

function PayBody({ occurrence, onDone }: { occurrence: BillOccurrence; onDone: () => void }) {
  const { timezone } = useUserSettings();
  const format = useFormatMoney();
  const pay = usePayBill();
  const accounts = useBillAccounts();
  const methods = usePaymentMethods();
  // One key per opening of this dialog: a retry after a timeout replays instead of paying twice.
  const [idempotencyKey] = useState(generateUuid);
  const bill = occurrence.bill!;

  const form = useForm<PayFormValues>({
    resolver: zodResolver(PayFormSchema),
    defaultValues: {
      account_id: bill.account?.id ?? "",
      amount: occurrence.amount.amount,
      paid_on: todayIn(timezone),
      payment_method_id: "",
    },
  });

  const onSubmit = (values: PayFormValues) =>
    pay.mutate(
      { billId: bill.id, occurrenceId: occurrence.id, values, idempotencyKey },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          poof(
            `-${format({ amount: values.amount || occurrence.amount.amount, currency: occurrence.amount.currency })}`
          );
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <p className="text-muted-foreground text-sm">
          Due {longDate(occurrence.due_date)}, usually{" "}
          <MoneyDisplay value={occurrence.amount} tone="neutral" />. Paying records one expense
          {bill.category ? ` in ${bill.category.name}` : ""}.
        </p>

        <Controller
          name="account_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pay-account">Paid from</FieldLabel>
              <Autocomplete
                id="pay-account"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={[
                  { value: TRACK_ONLY, label: "None – track only", hint: "No balance change" },
                  ...(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name })),
                ]}
                loading={accounts.isLoading}
                placeholder="Choose an account"
                emptyMessage="No accounts match."
                invalid={fieldState.invalid}
                required
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                field.value === TRACK_ONLY && (
                  <FieldDescription>
                    Records the payment as spending, but no account balance changes.
                  </FieldDescription>
                )
              )}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pay-amount">Amount paid</FieldLabel>
                <CurrencyInput
                  id="pay-amount"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="paid_on"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pay-date">Paid on</FieldLabel>
                <Input {...field} id="pay-date" type="date" aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  occurrence.status === "overdue" && (
                    <FieldDescription>
                      Paid it back then? Use that date so it counts in the right cutoff.
                    </FieldDescription>
                  )
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="payment_method_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pay-method">Payment method (optional)</FieldLabel>
              <Autocomplete
                id="pay-method"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={(methods.data ?? []).map((m) => ({ value: m.id, label: m.name }))}
                loading={methods.isLoading}
                placeholder="Not specified"
                emptyMessage="No payment methods match."
                invalid={fieldState.invalid}
                clearable
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pay.isPending}>
          {pay.isPending ? "Saving..." : "Mark as paid"}
        </Button>
      </FieldGroup>
    </form>
  );
}
