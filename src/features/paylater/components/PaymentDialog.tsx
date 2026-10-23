"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof, questComplete } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay, useFormatMoney } from "@/components/shared/money-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { isZero, type Money } from "@/lib/money";
import { todayIn } from "@/lib/utils/date";
import { applyApiErrors } from "@/lib/utils/form";
import { generateUuid } from "@/lib/utils/string";

import { paylaterApi, type PaymentScope } from "../api";
import {
  useCashAccounts,
  useCorrectPayment,
  usePay,
  usePaymentMethods,
  useSpendingCategories,
} from "../hooks";
import { PaymentFormSchema, type Payment, type PaymentFormValues } from "../schema";
import { longDate } from "./paylater-bits";

const FIELDS = [
  "amount",
  "payment_date",
  "payment_method_id",
  "reference_number",
  "notes",
  "record_as",
  "account_id",
  "category_id",
  "transaction_id",
] as const;

export type PaymentTarget = {
  accountId: string;
  scope: PaymentScope;
  /** What's being paid, in words: "Rice cooker, installment 2", "Shopee SPayLater bill". */
  label: string;
  /** What's still owed in this scope, as the API reports it. */
  owed: Money;
  /** The purchase's category, offered first for the expense. */
  categoryId?: string | null;
};

type PaymentDialogProps = {
  /** Record a payment against this; null closes. */
  target: PaymentTarget | null;
  /** Or correct this payment. */
  payment?: Payment | null;
  onOpenChange: (open: boolean) => void;
};

export function PaymentDialog({ target, payment, onOpenChange }: PaymentDialogProps) {
  const open = !!target || !!payment;

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={payment ? "Correct a payment" : target ? `Pay: ${target.label}` : ""}
    >
      {open && (
        <PaymentBody
          key={payment?.id ?? target?.label}
          target={target}
          payment={payment ?? null}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function PaymentBody({
  target,
  payment,
  onDone,
}: {
  target: PaymentTarget | null;
  payment: Payment | null;
  onDone: () => void;
}) {
  const { timezone, currency } = useUserSettings();
  const format = useFormatMoney();
  const pay = usePay();
  const correct = useCorrectPayment();
  const cashAccounts = useCashAccounts();
  const categories = useSpendingCategories();
  const paymentMethods = usePaymentMethods();
  // One key per opened form: a double-tap or retry can never record the same payment twice.
  const [idempotencyKey] = useState(generateUuid);
  const pending = pay.isPending || correct.isPending;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues: {
      amount: payment?.amount.amount ?? "",
      payment_date: payment?.payment_date ?? todayIn(timezone),
      payment_method_id: payment?.payment_method?.id ?? "",
      reference_number: payment?.reference_number ?? "",
      notes: payment?.notes ?? "",
      record_as: "expense",
      account_id: "",
      category_id: target?.categoryId ?? "",
      transaction_id: "",
    },
  });
  const recordAs = useWatch({ control: form.control, name: "record_as" });

  const onSubmit = (values: PaymentFormValues) => {
    if (!payment && values.record_as === "expense" && !values.category_id) {
      form.setError("category_id", { message: "Choose a spending category for this expense." });
      return;
    }
    if (!payment && values.record_as === "link" && !values.transaction_id) {
      form.setError("transaction_id", { message: "Choose the expense you already recorded." });
      return;
    }

    const onError = (error: Error) => applyApiErrors(error, form.setError, FIELDS);

    if (payment) {
      correct.mutate(
        { id: payment.id, values },
        {
          onSuccess: (res) => {
            toast.success(res.message);
            onDone();
          },
          onError,
        }
      );
      return;
    }

    pay.mutate(
      { accountId: target!.accountId, scope: target!.scope, values, idempotencyKey },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          // Paying off everything that was owed here completes the quest.
          if (values.amount === target!.owed.amount) {
            questComplete(`${target!.label}: paid`);
          } else {
            poof(`-${format({ amount: values.amount, currency })}`);
          }
          onDone();
        },
        onError,
      }
    );
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {target && (
          <div className="pixel-box bg-muted flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
            <span className="font-pixel text-sm">{target.label}</span>
            <span className="text-sm">
              <MoneyDisplay value={target.owed} className="font-stat text-2xl" /> owed
            </span>
          </div>
        )}
        {target?.scope.purchaseId === undefined &&
          target?.scope.installmentId === undefined &&
          target && (
            <p className="text-muted-foreground text-sm">
              The payment goes to the earliest due installments first, across this account&apos;s
              purchases.
            </p>
          )}

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pl-payment-amount">Amount</FieldLabel>
              <CurrencyInput
                id="pl-payment-amount"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                target &&
                !isZero(target.owed) && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto justify-start px-0"
                    onClick={() =>
                      form.setValue("amount", target.owed.amount, { shouldValidate: true })
                    }
                  >
                    Pay it all: <MoneyDisplay value={target.owed} tone="neutral" />
                  </Button>
                )
              )}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="payment_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pl-payment-date">Paid on</FieldLabel>
                <Input
                  {...field}
                  id="pl-payment-date"
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="payment_method_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pl-payment-method">Payment method (optional)</FieldLabel>
                <Autocomplete
                  id="pl-payment-method"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={(paymentMethods.data ?? []).map((m) => ({ value: m.id, label: m.name }))}
                  loading={paymentMethods.isLoading}
                  placeholder="Cash, GCash, bank transfer…"
                  emptyMessage="No payment methods match."
                  invalid={fieldState.invalid}
                  clearable
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {payment ? (
          <p className="text-muted-foreground text-sm">
            {payment.record_as === "expense"
              ? "Its expense is corrected too."
              : payment.record_as === "link"
                ? "It's linked to an expense you recorded, so its amount can't change here. Void it and link the right expense instead."
                : "It isn't recorded as an expense."}
          </p>
        ) : (
          <>
            <Controller
              name="record_as"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel id="pl-record-label">In my spending</FieldLabel>
                  <ChoiceCards
                    aria-labelledby="pl-record-label"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="sm:grid-cols-1"
                    choices={[
                      {
                        value: "expense",
                        label: "Record it as an expense",
                        description: "Counts as spending now, under a category.",
                      },
                      {
                        value: "link",
                        label: "I already recorded it",
                        description: "Link the expense you added, so it isn't counted twice.",
                      },
                      {
                        value: "none",
                        label: "Don't record it",
                        description: "Only the PayLater balance changes.",
                      },
                    ]}
                  />
                </Field>
              )}
            />

            {recordAs === "expense" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="category_id"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="pl-payment-category">Spending category</FieldLabel>
                      <Autocomplete
                        id="pl-payment-category"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={(categories.data ?? []).map((c) => ({
                          value: c.id,
                          label: c.name,
                          color: c.color,
                        }))}
                        loading={categories.isLoading}
                        placeholder="Choose a category"
                        emptyMessage="No categories match."
                        invalid={fieldState.invalid}
                        required
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
                      <FieldLabel htmlFor="pl-payment-account">Paid from</FieldLabel>
                      <Autocomplete
                        id="pl-payment-account"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={(cashAccounts.data ?? []).map((a) => ({
                          value: a.id,
                          label: a.name,
                        }))}
                        loading={cashAccounts.isLoading}
                        placeholder="None – track only"
                        emptyMessage="No accounts match."
                        invalid={fieldState.invalid}
                        clearable
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            )}

            {recordAs === "link" && (
              <Controller
                name="transaction_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pl-payment-link">The expense you recorded</FieldLabel>
                    <Autocomplete
                      id="pl-payment-link"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={[]}
                      loadOptions={async (query, signal) => {
                        const res = await paylaterApi.searchExpenses(query, signal);
                        // Expenses already tied to a bill, income, debt or payment can't be linked again.
                        return res.data.data
                          .filter(
                            (t) =>
                              !t.bill_occurrence_id &&
                              !t.from_income_record &&
                              !t.from_debt &&
                              !t.from_paylater
                          )
                          .map((t) => ({
                            value: t.id,
                            label: `${t.description} · ${longDate(t.transaction_date)}`,
                            hint: format(t.amount),
                          }));
                      }}
                      placeholder="Search your expenses"
                      emptyMessage="No matching expenses."
                      invalid={fieldState.invalid}
                      required
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        It must be the same amount as this payment.
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            )}
          </>
        )}

        <Controller
          name="reference_number"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pl-payment-ref">Reference number (optional)</FieldLabel>
              <Input {...field} id="pl-payment-ref" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="pl-payment-notes">Notes (optional)</FieldLabel>
              <Textarea
                {...field}
                id="pl-payment-notes"
                rows={2}
                aria-invalid={fieldState.invalid}
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

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : payment ? "Save correction" : "Record payment"}
        </Button>
      </FieldGroup>
    </form>
  );
}
