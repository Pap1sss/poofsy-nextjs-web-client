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
import { applyApiErrors } from "@/lib/utils/form";

import {
  useCorrectSettlement,
  useDebtAccounts,
  usePaymentMethods,
  useSettleDebt,
  useSpendingCategories,
} from "../hooks";
import {
  SettlementFormSchema,
  type DebtDetail,
  type RecordAs,
  type Settlement,
  type SettlementFormValues,
} from "../schema";
import { todayIn } from "@/lib/utils/date";

const FIELDS = [
  "amount",
  "settlement_date",
  "payment_method_id",
  "reference_number",
  "notes",
  "record_as",
  "account_id",
  "category_id",
] as const;

// Each choice in the debt's own words: receiving money back, or paying it out.
const RECORD_CHOICES: Record<
  DebtDetail["direction"],
  { value: RecordAs; label: string; description: string }[]
> = {
  receivable: [
    {
      value: "balance",
      label: "Back in my account",
      description: "The account goes up. Not counted as income, since it was your money already.",
    },
    {
      value: "cash_flow",
      label: "As income",
      description: "Counts as income in budgets and reports.",
    },
    {
      value: "none",
      label: "Don't record it",
      description: "Already recorded, or it went somewhere you don't track.",
    },
  ],
  payable: [
    {
      value: "balance",
      label: "Out of my account",
      description:
        "The account goes down. Not counted as spending, so a purchase you already recorded isn't counted twice.",
    },
    {
      value: "cash_flow",
      label: "As an expense",
      description: "Counts as spending under a category.",
    },
    {
      value: "none",
      label: "Don't record it",
      description: "Already recorded, or paid from somewhere you don't track.",
    },
  ],
};

type SettlementDialogProps = {
  /** The debt being paid; null closes the dialog. */
  debt: DebtDetail | null;
  /** A payment to correct; omit to record a new one. */
  settlement?: Settlement | null;
  onOpenChange: (open: boolean) => void;
};

export function SettlementDialog({ debt, settlement, onOpenChange }: SettlementDialogProps) {
  const receivable = debt?.direction === "receivable";

  return (
    <FormShell
      open={!!debt}
      onOpenChange={onOpenChange}
      title={
        !debt
          ? ""
          : settlement
            ? "Correct a payment"
            : receivable
              ? `${debt.person.name} paid you`
              : `You paid ${debt.person.name}`
      }
    >
      {debt && (
        <SettlementBody
          key={`${debt.id}-${settlement?.id ?? "new"}`}
          debt={debt}
          settlement={settlement ?? null}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function SettlementBody({
  debt,
  settlement,
  onDone,
}: {
  debt: DebtDetail;
  settlement: Settlement | null;
  onDone: () => void;
}) {
  const { timezone, currency } = useUserSettings();
  const format = useFormatMoney();
  const settle = useSettleDebt();
  const correct = useCorrectSettlement();
  const accounts = useDebtAccounts();
  const categories = useSpendingCategories();
  const paymentMethods = usePaymentMethods();
  // One key per opened form: a double-tap or retry can never record the same payment twice.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const receivable = debt.direction === "receivable";
  const pending = settle.isPending || correct.isPending;

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(SettlementFormSchema),
    defaultValues: {
      amount: settlement?.amount.amount ?? "",
      settlement_date: settlement?.settlement_date ?? todayIn(timezone),
      payment_method_id: settlement?.payment_method?.id ?? "",
      reference_number: settlement?.reference_number ?? "",
      notes: settlement?.notes ?? "",
      record_as: "balance",
      account_id: "",
      category_id: "",
    },
  });

  const recordAs = useWatch({ control: form.control, name: "record_as" });
  const needsAccount = recordAs !== "none";
  const needsCategory = recordAs === "cash_flow" && !receivable;

  const onSubmit = (values: SettlementFormValues) => {
    if (!settlement && needsAccount && !values.account_id) {
      form.setError("account_id", { message: "Choose the account the money moved in or out of." });
      return;
    }
    if (!settlement && needsCategory && !values.category_id) {
      form.setError("category_id", { message: "Choose a spending category for this expense." });
      return;
    }

    const payload = {
      ...values,
      category_id: needsCategory ? values.category_id : "",
      account_id: needsAccount ? values.account_id : "",
    };

    const onSuccess = (res: { message: string; data: DebtDetail }) => {
      toast.success(res.message);
      // Paying the last of it completes the quest; any other payment just poofs.
      if (res.data.status === "settled" && debt.status !== "settled") {
        questComplete(`${debt.person.name}: all square`);
      } else if (!settlement) {
        const amount = format({ amount: values.amount || "0", currency });
        poof(receivable ? `+${amount}` : `-${amount}`);
      }
      onDone();
    };
    const onError = (error: Error) => applyApiErrors(error, form.setError, FIELDS);

    if (settlement) {
      correct.mutate(
        { debtId: debt.id, settlementId: settlement.id, values: payload },
        { onSuccess, onError }
      );
    } else {
      settle.mutate({ debtId: debt.id, values: payload, idempotencyKey }, { onSuccess, onError });
    }
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="pixel-box bg-muted flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
          <span className="font-pixel text-sm">{debt.description}</span>
          <span className="text-sm">
            <MoneyDisplay value={debt.remaining} className="font-stat text-2xl" /> left
          </span>
        </div>

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settlement-amount">Amount</FieldLabel>
              <CurrencyInput
                id="settlement-amount"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                !settlement && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto justify-start px-0"
                    onClick={() =>
                      form.setValue("amount", debt.remaining.amount, { shouldValidate: true })
                    }
                  >
                    Pay it all: <MoneyDisplay value={debt.remaining} tone="neutral" />
                  </Button>
                )
              )}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="settlement_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settlement-date">Paid on</FieldLabel>
                <Input
                  {...field}
                  id="settlement-date"
                  type="date"
                  min={debt.debt_date}
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
                <FieldLabel htmlFor="settlement-method">Payment method (optional)</FieldLabel>
                <Autocomplete
                  id="settlement-method"
                  value={field.value}
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

        {settlement ? (
          <p className="text-muted-foreground text-sm">
            {settlement.account
              ? `Its transaction in ${settlement.account.name} is corrected too. To move it to another account, void this payment and record it again.`
              : "This payment isn't recorded in any account."}
          </p>
        ) : (
          <>
            <Controller
              name="record_as"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel id="settlement-record-label">In my accounts</FieldLabel>
                  <ChoiceCards
                    aria-labelledby="settlement-record-label"
                    value={field.value}
                    onValueChange={field.onChange}
                    choices={RECORD_CHOICES[debt.direction]}
                    className="sm:grid-cols-1"
                  />
                </Field>
              )}
            />

            {needsAccount && (
              <Controller
                name="account_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settlement-account">
                      {receivable ? "Received in" : "Paid from"}
                    </FieldLabel>
                    <Autocomplete
                      id="settlement-account"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
                      loading={accounts.isLoading}
                      placeholder="Choose an account"
                      emptyMessage="No accounts match."
                      invalid={fieldState.invalid}
                      required
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            {needsCategory && (
              <Controller
                name="category_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settlement-category">Spending category</FieldLabel>
                    <Autocomplete
                      id="settlement-category"
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
            )}
          </>
        )}

        <Controller
          name="reference_number"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settlement-reference">Reference number (optional)</FieldLabel>
              <Input {...field} id="settlement-reference" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settlement-notes">Notes (optional)</FieldLabel>
              <Textarea
                {...field}
                id="settlement-notes"
                rows={2}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>Shown in this debt&apos;s payment history.</FieldDescription>
              )}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : settlement ? "Save correction" : "Record payment"}
        </Button>
      </FieldGroup>
    </form>
  );
}
