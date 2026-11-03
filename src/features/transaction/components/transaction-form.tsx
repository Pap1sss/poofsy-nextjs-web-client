"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { RadioGroup } from "radix-ui";
import { toast } from "sonner";

import { poof } from "@/components/pixel/poof";
import { Autocomplete, type AutocompleteOption } from "@/components/shared/autocomplete";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { segmentClass } from "@/components/ui/segments";
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

/** The type strip: an icon each, and one plain sentence under the strip for the chosen type. */
const TYPE_CHOICES: { value: TransactionType; icon: LucideIcon; hint: string }[] = [
  { value: "expense", icon: ArrowUpRight, hint: "Money you spent. It leaves an account." },
  { value: "income", icon: ArrowDownLeft, hint: "Money you received. It goes into an account." },
  {
    value: "transfer",
    icon: ArrowLeftRight,
    hint: "Moving money between your own accounts. It isn't spending or income.",
  },
  {
    value: "adjustment",
    icon: SlidersHorizontal,
    hint: "Fix an account's balance so it matches your bank or wallet.",
  },
];

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

const DESCRIPTION_PLACEHOLDER: Record<TransactionType, string> = {
  expense: "Groceries, jeepney fare",
  income: "Salary, sideline, gift",
  transfer: "Savings to MariBank",
  adjustment: "Match bank statement",
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

/** The calendar day before a YYYY-MM-DD date, parsed as local midnight so no time zone shifts it. */
const dayBefore = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
  const today = todayIn(timezone);
  const yesterday = dayBefore(today);

  const accounts = useAccountOptions();
  const categories = useCategoryOptions();
  const paymentMethods = usePaymentMethodOptions();
  const { mutate: save, isPending } = useSaveTransaction();
  const [moreOpen, setMoreOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: initialValues(transaction, defaults, today),
  });

  // Each time the shell opens, start from the record (or the defaults) it was opened for.
  useEffect(() => {
    if (open) {
      form.reset(initialValues(transaction, defaults, todayIn(timezone)));
      setMoreOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id]);

  const type = useWatch({ control: form.control, name: "type" });
  const accountId = useWatch({ control: form.control, name: "account_id" });
  const excluded = useWatch({ control: form.control, name: "exclude_from_budget" });
  const date = useWatch({ control: form.control, name: "transaction_date" });
  const paymentMethodId = useWatch({ control: form.control, name: "payment_method_id" });
  const notes = useWatch({ control: form.control, name: "notes" });
  const categoryRequired = type === "expense" && !excluded;
  const hasPaymentMethod = type !== "adjustment";

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

  const paymentMethodName = paymentMethods.data?.find((m) => m.id === paymentMethodId)?.name;
  const moreSummary =
    [hasPaymentMethod && paymentMethodName, notes.trim() && "Note"].filter(Boolean).join(" · ") ||
    (hasPaymentMethod ? "Payment method, notes" : "Notes");

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
        onError: (error) => {
          applyApiErrors(error, form.setError, FIELDS);
          if (
            form.getFieldState("payment_method_id").invalid ||
            form.getFieldState("notes").invalid
          ) {
            setMoreOpen(true);
          }
        },
      }
    );

  const rootError = form.formState.errors.root?.message;
  const typeHint = TYPE_CHOICES.find((c) => c.value === type)?.hint;

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit transaction" : "Add transaction"}
      size="xl"
    >
      <form
        id="transaction-form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (errors.payment_method_id || errors.notes) setMoreOpen(true);
        })}
      >
        <FieldGroup>
          {/* 1. What kind of money movement: one compact strip, explained in a sentence. */}
          <Field>
            <FieldLabel id="transaction-type-label" className="sr-only">
              Type
            </FieldLabel>
            <RadioGroup.Root
              aria-labelledby="transaction-type-label"
              value={type}
              onValueChange={(next) => changeType(next as TransactionType)}
              className="pixel-box bg-muted grid grid-cols-4 gap-1 p-1"
            >
              {TYPE_CHOICES.map(({ value, icon: Icon }) => (
                <RadioGroup.Item
                  key={value}
                  value={value}
                  className={cn(
                    segmentClass,
                    "h-auto min-h-14 cursor-pointer flex-col gap-1 px-1 py-1.5 text-xs sm:text-sm",
                    "data-[state=checked]:border-outline data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground"
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                  {TYPE_LABELS[value]}
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
            <FieldDescription aria-live="polite">{typeHint}</FieldDescription>
          </Field>

          {/* 2. How much and what for: the two fields every transaction needs. */}
          <div className="pixel-panel space-y-3 p-3">
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className={cn(
                    "[&_[data-slot=input-group]]:h-14 [&_input]:font-stat [&_input]:text-3xl",
                    type === "expense" && "[&_input]:text-expense",
                    type === "income" && "[&_input]:text-income"
                  )}
                >
                  <FieldLabel htmlFor="transaction-amount">Amount</FieldLabel>
                  <CurrencyInput
                    id="transaction-amount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    placeholder="0.00"
                    autoFocus={!editing}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

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
                    placeholder={DESCRIPTION_PLACEHOLDER[type]}
                    maxLength={255}
                    enterKeyHint="next"
                    className="h-11"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {/* 3. Where the money moves. A transfer reads top to bottom: from ↓ to. */}
          <div className="space-y-2">
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
              <>
                <ArrowDown aria-hidden className="text-muted-foreground mx-auto size-5" />
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
              </>
            )}
          </div>

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
                    className="grid-cols-2"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          )}

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
                        Optional. Tag savings so they count toward that goal.
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

          {/* 4. When: today is the default; one tap for yesterday, or pick any date. */}
          <Controller
            name="transaction_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: today, label: "Today" },
                    { value: yesterday, label: "Yesterday" },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      aria-pressed={date === chip.value}
                      onClick={() => form.setValue("transaction_date", chip.value)}
                      className={cn(segmentClass, "pixel-box bg-card h-10 px-3")}
                    >
                      {chip.label}
                    </button>
                  ))}
                  <Input
                    {...field}
                    id="transaction-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                    className="h-10 w-auto min-w-40 flex-1"
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* 5. Optional extras, folded away with a summary of what's set. */}
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger className="pixel-box bg-card hover:bg-accent focus-visible:outline-highlight group flex min-h-11 w-full items-center gap-2 px-3 text-left outline-none focus-visible:outline-3">
              <span className="font-pixel text-sm">More options</span>
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-right text-sm">
                {moreSummary}
              </span>
              <ChevronDown
                className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-4 pt-3">
              {hasPaymentMethod && (
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
            </CollapsibleContent>
          </Collapsible>

          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>

        {/* Pinned to the bottom of the dialog or sheet, so saving never needs a scroll. */}
        <div
          className={cn(
            "bg-card border-outline sticky -bottom-[19px] z-10 -mx-[19px] mt-6 -mb-[19px] flex justify-end gap-2 border-t-2 px-[19px] py-3 in-data-[slot=sheet-content]:-bottom-4 in-data-[slot=sheet-content]:-mx-4 in-data-[slot=sheet-content]:-mb-4 in-data-[slot=sheet-content]:px-4",
            // Receipts follow the form when editing, so the bar can't pull them up underneath it.
            editing && "mb-0 in-data-[slot=sheet-content]:mb-0"
          )}
        >
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="h-11 min-w-36 flex-1 sm:flex-none">
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
