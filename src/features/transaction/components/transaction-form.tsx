"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof } from "@/components/pixel/poof";
import { Autocomplete, type AutocompleteOption } from "@/components/shared/autocomplete";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { cn } from "@/lib/utils/component";
import { applyApiErrors } from "@/lib/utils/form";

import { TYPE_LABELS } from "../constant";
import {
  useAccountOptions,
  useCategoryOptions,
  usePaymentMethodOptions,
  useSaveTransaction,
} from "../hooks";
import {
  TRACK_ONLY,
  TransactionFormSchema,
  type Transaction,
  type TransactionFormValues,
  type TransactionType,
} from "../schema";

import { transactionAmountLabel } from "./transaction-amount";
import { TransactionReceipts } from "./transaction-receipts";

export type TransactionFormDefaults = Partial<
  Pick<
    TransactionFormValues,
    | "type"
    | "amount"
    | "account_id"
    | "to_account_id"
    | "category_id"
    | "payment_method_id"
    | "transaction_date"
    | "description"
  >
>;

export type TransactionFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this transaction; omit to add a new one. */
  transaction?: Transaction | null;
  /** Prefill for a new transaction, e.g. { type: "transfer", category_id } from a budget row. */
  defaults?: TransactionFormDefaults;
  onSaved?: (transaction: Transaction) => void;
};

const TYPE_CHOICES = [
  { value: "expense", label: TYPE_LABELS.expense, description: "Money you spent" },
  { value: "income", label: TYPE_LABELS.income, description: "Money you received" },
  { value: "transfer", label: TYPE_LABELS.transfer, description: "Between your own accounts" },
  { value: "adjustment", label: TYPE_LABELS.adjustment, description: "Correct a balance" },
] as const;

const DIRECTION_CHOICES = [
  { value: "increase", label: "Balance goes up" },
  { value: "decrease", label: "Balance goes down" },
] as const;

const ACCOUNT_LABEL: Record<TransactionType, string> = {
  expense: "Paid from",
  income: "Received in",
  transfer: "From account",
  adjustment: "Account",
};

const FIELDS = [
  "type",
  "amount",
  "account_id",
  "to_account_id",
  "category_id",
  "payment_method_id",
  "adjustment_direction",
  "exclude_from_budget",
  "transaction_date",
  "description",
  "notes",
] as const;

/** Today's date in the user's own time zone, as YYYY-MM-DD. */
const todayIn = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());

function initialValues(
  transaction: Transaction | null | undefined,
  defaults: TransactionFormDefaults | undefined,
  today: string
): TransactionFormValues {
  if (transaction) {
    return {
      type: transaction.type,
      amount: transaction.amount.amount,
      // An expense saved without an account is track-only.
      account_id: transaction.account?.id ?? (transaction.type === "expense" ? TRACK_ONLY : ""),
      to_account_id: transaction.to_account?.id ?? "",
      category_id: transaction.category?.id ?? "",
      payment_method_id: transaction.payment_method?.id ?? "",
      adjustment_direction: transaction.adjustment_direction ?? "",
      exclude_from_budget: transaction.exclude_from_budget,
      transaction_date: transaction.transaction_date,
      description: transaction.description,
      notes: transaction.notes ?? "",
    };
  }

  return {
    type: "expense",
    amount: "",
    account_id: "",
    to_account_id: "",
    category_id: "",
    payment_method_id: "",
    adjustment_direction: "",
    exclude_from_budget: false,
    transaction_date: today,
    description: "",
    notes: "",
    ...defaults,
  };
}

/** Add or edit one ledger row. Fields follow the type, exactly as TransactionRequest validates them. */
export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  defaults,
  onSaved,
}: TransactionFormProps) {
  const { timezone, locale } = useUserSettings();
  const editing = !!transaction;

  const accounts = useAccountOptions();
  const categories = useCategoryOptions();
  const paymentMethods = usePaymentMethodOptions();
  const { mutate: save, isPending } = useSaveTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: initialValues(transaction, defaults, todayIn(timezone)),
  });

  // Each time the shell opens, start from the record (or the defaults) it was opened for.
  useEffect(() => {
    if (open) form.reset(initialValues(transaction, defaults, todayIn(timezone)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id]);

  const type = useWatch({ control: form.control, name: "type" });
  const accountId = useWatch({ control: form.control, name: "account_id" });
  const excluded = useWatch({ control: form.control, name: "exclude_from_budget" });
  const categoryRequired = type === "expense" && !excluded;

  // Archived records stay selectable only when this transaction already uses them.
  const usable = <T extends { id: string; name: string; archived_at: string | null }>(
    items: T[] | undefined,
    current: string
  ) => (items ?? []).filter((item) => !item.archived_at || item.id === current);
  const toOption = (item: { id: string; name: string }): AutocompleteOption => ({
    value: item.id,
    label: item.name,
  });

  const accountOptions = [
    ...(type === "expense"
      ? [{ value: TRACK_ONLY, label: "None – track only", hint: "No balance change" }]
      : []),
    ...usable(accounts.data, form.getValues("account_id")).map(toOption),
  ];
  const toAccountOptions = usable(accounts.data, form.getValues("to_account_id"))
    .filter((a) => a.id !== accountId)
    .map(toOption);
  // Expenses take spending categories; transfers may carry a savings or investment one.
  const categoryOptions = usable(categories.data, form.getValues("category_id"))
    .filter((c) => (type === "expense" ? c.kind === "spending" : c.kind !== "spending"))
    .map((c) => ({ ...toOption(c), color: c.color }));
  const paymentMethodOptions = usable(paymentMethods.data, form.getValues("payment_method_id")).map(
    toOption
  );

  const changeType = (next: TransactionType) => {
    form.setValue("type", next);
    // A spending category can't stay on a transfer, nor a savings one on an expense.
    form.setValue("category_id", "");
    // Only expenses can be track-only; every other type needs a real account.
    if (next !== "expense" && form.getValues("account_id") === TRACK_ONLY) {
      form.setValue("account_id", "");
    }
    form.clearErrors();
  };

  const onSubmit = (values: TransactionFormValues) =>
    save(
      { id: transaction?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          // Money just moved: a little poof for new entries (not for edits).
          if (!transaction) {
            poof(transactionAmountLabel(res.data, locale));
          }
          onSaved?.(res.data);
          onOpenChange(false);
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit transaction" : "Add transaction"}
      size="xl"
    >
      <form id="transaction-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel id="transaction-type-label">Type</FieldLabel>
            <ChoiceCards
              aria-labelledby="transaction-type-label"
              value={type}
              onValueChange={changeType}
              choices={TYPE_CHOICES}
              // 2×2 on phones too: four stacked tiles would fill the first screen.
              className="grid-cols-2 [&_[role=radio]]:px-3 sm:[&_[role=radio]]:px-4"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-amount">Amount</FieldLabel>
                  <CurrencyInput
                    id="transaction-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    placeholder="0.00"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="transaction_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
                  <Input
                    {...field}
                    id="transaction-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="transaction-description">Description</FieldLabel>
                <Input
                  {...field}
                  id="transaction-description"
                  aria-invalid={fieldState.invalid}
                  placeholder={
                    type === "income"
                      ? "Salary, sideline, gift"
                      : type === "transfer"
                        ? "Savings to MariBank"
                        : type === "adjustment"
                          ? "Match bank statement"
                          : "Groceries, jeepney fare"
                  }
                  maxLength={255}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Two columns only for a transfer (from and to); otherwise the account takes the full row. */}
          <div className={cn("grid gap-6", type === "transfer" && "sm:grid-cols-2")}>
            <Controller
              name="account_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-account">{ACCOUNT_LABEL[type]}</FieldLabel>
                  <Autocomplete
                    id="transaction-account"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={accountOptions}
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
                        Counts toward your spending and budget, but no account balance changes.
                      </FieldDescription>
                    )
                  )}
                </Field>
              )}
            />

            {type === "transfer" && (
              <Controller
                name="to_account_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="transaction-to-account">To account</FieldLabel>
                    <Autocomplete
                      id="transaction-to-account"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={toAccountOptions}
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

            {type === "adjustment" && (
              <Controller
                name="adjustment_direction"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel id="transaction-direction-label">Direction</FieldLabel>
                    <ChoiceCards
                      aria-labelledby="transaction-direction-label"
                      // "" (nothing picked yet) leaves both tiles unchecked.
                      value={field.value as "increase" | "decrease"}
                      onValueChange={field.onChange}
                      choices={DIRECTION_CHOICES}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
          </div>

          {(type === "expense" || type === "transfer") && (
            <Controller
              name="category_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-category">
                    {type === "transfer" ? "Savings or investment category" : "Category"}
                  </FieldLabel>
                  <Autocomplete
                    id="transaction-category"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={categoryOptions}
                    loading={categories.isLoading}
                    placeholder={categoryRequired ? "Choose a category" : "No category"}
                    emptyMessage="No categories match."
                    invalid={fieldState.invalid}
                    clearable={!categoryRequired}
                    required={categoryRequired}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    type === "transfer" && (
                      <FieldDescription>
                        Tag savings so they count toward that goal.
                      </FieldDescription>
                    )
                  )}
                </Field>
              )}
            />
          )}

          {type === "expense" && (
            <Controller
              name="exclude_from_budget"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="transaction-exclude-from-budget"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="transaction-exclude-from-budget">
                      Don&apos;t count in Payday Planner
                    </FieldLabel>
                    <FieldDescription>
                      For money you already had, like savings. It still counts in reports and lowers
                      the account balance.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            />
          )}

          {type !== "adjustment" && (
            <Controller
              name="payment_method_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-payment-method">Payment method</FieldLabel>
                  <Autocomplete
                    id="transaction-payment-method"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={paymentMethodOptions}
                    loading={paymentMethods.isLoading}
                    placeholder="Not specified"
                    emptyMessage="No payment methods match."
                    invalid={fieldState.invalid}
                    clearable
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          )}

          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="transaction-notes">Notes</FieldLabel>
                <Textarea
                  {...field}
                  id="transaction-notes"
                  rows={2}
                  maxLength={2000}
                  aria-invalid={fieldState.invalid}
                  placeholder="Optional"
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
        </FieldGroup>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="min-w-28">
            {isPending ? "Saving..." : editing ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </form>

      {transaction && (
        <>
          <Separator className="my-6" />
          <TransactionReceipts transactionId={transaction.id} />
        </>
      )}
    </FormShell>
  );
}
