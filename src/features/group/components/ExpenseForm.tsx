"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Controller, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { ChevronDown, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { poof } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { segmentClass, segmentListClass } from "@/components/ui/segments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { relativeDayLabel, todayIn } from "@/lib/utils/date";
import { cn } from "@/lib/utils/component";
import { ApiValidationError } from "@/lib/utils/request";
import { generateUuid } from "@/lib/utils/string";

import { groupApi, toExpensePayload } from "../api";
import {
  ALLOCATION_LABELS,
  CHARGE_ALLOCATIONS,
  CHARGE_KINDS,
  CHARGE_LABELS,
  isDiscount,
  ITEM_SPLIT_LABELS,
  ITEM_SPLITS,
  SPLIT_HINTS,
  SPLIT_LABELS,
  SPLIT_METHODS,
} from "../constant";
import { useGroupAccounts, useGroupCategories, useSaveExpense, useSplitPreview } from "../hooks";
import type {
  Allocation,
  ExpenseFormValues,
  GroupDetail,
  GroupExpense,
  Participant,
  PartInput,
  SplitMethod,
} from "../schema";

type ExpenseFormProps = {
  group: GroupDetail;
  /** The expense to edit; null adds one. */
  expense: GroupExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExpenseForm({ group, expense, open, onOpenChange }: ExpenseFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      title={expense ? "Edit expense" : "Add an expense"}
    >
      {open && (
        <ExpenseFormBody
          key={expense?.id ?? "new"}
          group={group}
          expense={expense}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

/** Shares, percentages and quantities: digits and one point, up to 4 decimals (as the API accepts). */
const toNumberInput = (v: string) =>
  (v
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .match(/^\d*\.?\d{0,4}/) ?? [""])[0];

/** A tappable person chip (payer, "who had it"): pressed gets the cursor-yellow highlight. */
const personChipClass = cn(segmentClass, "pixel-box bg-card h-11 gap-1.5 px-3");

const blankItem = (): ExpenseFormValues["items"][number] => ({
  name: "",
  unit_price: "",
  quantity: "1",
  participant_ids: [],
  split: "equal",
  values: {},
});

const blankParts = (people: Participant[], included = true): Record<string, PartInput> =>
  Object.fromEntries(people.map((p) => [p.id, { included, value: "" }]));

const partsFrom = (
  people: Participant[],
  rows: { participant_id: string; value: string | null }[],
  allIncludedWhenEmpty: boolean
): Record<string, PartInput> =>
  Object.fromEntries(
    people.map((p) => {
      const row = rows.find((r) => r.participant_id === p.id);
      return [
        p.id,
        {
          included: row ? true : allIncludedWhenEmpty && rows.length === 0,
          value: row?.value ?? "",
        },
      ];
    })
  );

function defaults(
  people: Participant[],
  expense: GroupExpense | null,
  today: string
): ExpenseFormValues {
  const me = people.find((p) => p.is_me);

  if (!expense) {
    return {
      description: "",
      expense_date: today,
      category_id: "",
      notes: "",
      split_method: "equal",
      subtotal: "",
      parts: blankParts(people),
      items: [blankItem()],
      charges: [],
      payer_mode: "single",
      payer_id: me?.id ?? people[0]?.id ?? "",
      payer_amounts: Object.fromEntries(people.map((p) => [p.id, ""])),
      record_share: false,
      share_account_id: "",
    };
  }

  const single = expense.payers.length === 1;

  return {
    description: expense.description,
    expense_date: expense.expense_date,
    category_id: expense.category?.id ?? "",
    notes: expense.notes ?? "",
    split_method: expense.split_method,
    subtotal: expense.split_method === "items" ? "" : expense.subtotal.amount,
    parts: partsFrom(people, expense.splits, expense.split_method === "items"),
    items: expense.items.length
      ? expense.items.map((item) => ({
          name: item.name,
          unit_price: item.unit_price.amount,
          quantity: item.quantity,
          participant_ids: item.participant_ids,
          split: item.split,
          values: Object.fromEntries(
            Object.entries(item.values ?? {}).map(([id, value]) => [id, value ?? ""])
          ),
        }))
      : [blankItem()],
    charges: expense.charges.map((charge) => ({
      kind: charge.kind,
      label: charge.label ?? "",
      amount: charge.amount.amount,
      allocation: charge.allocation,
      parts: partsFrom(people, charge.splits, false),
    })),
    payer_mode: single ? "single" : "multiple",
    payer_id: single ? expense.payers[0].participant_id : (me?.id ?? ""),
    payer_amounts: Object.fromEntries(
      people.map((p) => [
        p.id,
        expense.payers.find((x) => x.participant_id === p.id)?.amount.amount ?? "",
      ])
    ),
    record_share: expense.record_share,
    share_account_id: expense.share_account?.id ?? "",
  };
}

/** Enough filled in for the server to try a split. */
const previewable = (values: ExpenseFormValues) =>
  values.split_method === "items"
    ? values.items.some((item) => /[1-9]/.test(item.unit_price))
    : /[1-9]/.test(values.subtotal);

function ExpenseFormBody({
  group,
  expense,
  onDone,
}: {
  group: GroupDetail;
  expense: GroupExpense | null;
  onDone: () => void;
}) {
  const { timezone } = useUserSettings();
  const save = useSaveExpense();
  const accounts = useGroupAccounts();
  const categories = useGroupCategories();
  // One key per opened form: a double-tap or retry can never add the same expense twice.
  const [idempotencyKey] = useState(generateUuid);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Everyone active, plus archived people already in this expense (so editing keeps them).
  const people = useMemo(() => {
    const inExpense = new Set([
      ...(expense?.payers.map((p) => p.participant_id) ?? []),
      ...(expense?.allocations.map((a) => a.participant_id) ?? []),
    ]);
    return group.participants.filter((p) => !p.archived_at || inExpense.has(p.id));
  }, [group.participants, expense]);
  const order = people.map((p) => p.id);
  const me = people.find((p) => p.is_me);

  const form = useForm<ExpenseFormValues>({
    defaultValues: defaults(people, expense, todayIn(timezone)),
  });
  const items = useFieldArray({ control: form.control, name: "items" });
  const charges = useFieldArray({ control: form.control, name: "charges" });

  const values = useWatch({ control: form.control }) as ExpenseFormValues;
  const method = values.split_method;

  // The live breakdown: the server splits the form as it stands, a moment after typing stops.
  const draft = previewable(values) ? toExpensePayload(values, order) : null;
  const [debouncedDraft] = useDebounce(draft, 400, {
    equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
  const preview = useSplitPreview(group.id, debouncedDraft, expense?.id);
  const previewErrors =
    preview.error instanceof ApiValidationError
      ? Object.values(preview.error.errors).flat()
      : preview.error
        ? [preview.error.message]
        : [];
  const allocationOf = (id: string): Allocation | undefined =>
    preview.data?.allocations.find((a) => a.participant_id === id);

  const openSettlements = group.settlements.filter((s) => !s.voided_at).length;

  const onSubmit = async (formValues: ExpenseFormValues) => {
    setServerErrors([]);
    if (!formValues.description.trim()) {
      form.setError("description", { message: "Say what this was for." });
      return;
    }
    if (formValues.payer_mode === "single" && !formValues.payer_id) {
      form.setError("payer_id", { message: "Choose who paid." });
      return;
    }
    if (formValues.record_share && !formValues.category_id) {
      form.setError("category_id", { message: "Choose a spending category for your share." });
      setDetailsOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      // One payer pays the whole total, which the server works out (fees and discounts included).
      const base = toExpensePayload(formValues, order);
      const total =
        formValues.payer_mode === "single"
          ? (await groupApi.preview(group.id, base, expense?.id)).data.total.amount
          : undefined;
      const res = await save.mutateAsync({
        id: group.id,
        payload: toExpensePayload(formValues, order, total),
        expenseId: expense?.id ?? null,
        idempotencyKey,
      });
      toast.success(res.message);
      if (!expense) poof("Added!");
      onDone();
    } catch (error) {
      if (error instanceof ApiValidationError) {
        const simple = ["description", "expense_date", "category_id", "subtotal", "notes"] as const;
        const rest: string[] = [];
        for (const [field, messages] of Object.entries(error.errors)) {
          if ((simple as readonly string[]).includes(field)) {
            form.setError(field as (typeof simple)[number], { message: messages[0] });
            if (field === "expense_date" || field === "category_id" || field === "notes") {
              setDetailsOpen(true);
            }
          } else {
            rest.push(...messages);
          }
        }
        setServerErrors([...new Set(rest)]);
      } else {
        setServerErrors([error instanceof Error ? error.message : "Something went wrong."]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const today = todayIn(timezone);
  const dateLabel =
    relativeDayLabel(values.expense_date, today) ??
    (values.expense_date
      ? format(new Date(`${values.expense_date}T00:00:00`), "MMM d, yyyy")
      : "No date");
  const categoryName = categories.data?.find((c) => c.id === values.category_id)?.name;
  const detailsSummary = [dateLabel, categoryName ?? "No category", values.notes.trim() && "Note"]
    .filter(Boolean)
    .join(" · ");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (errors) => {
        if (errors.expense_date || errors.category_id || errors.notes) setDetailsOpen(true);
      })}
      noValidate
    >
      <FieldGroup>
        {expense && openSettlements > 0 && (
          <Alert>
            <AlertDescription>
              This group has {openSettlements} recorded{" "}
              {openSettlements === 1 ? "settlement" : "settlements"}. They stay as recorded;
              changing this expense changes everyone&apos;s balance, and the new balances show right
              away.
            </AlertDescription>
          </Alert>
        )}

        {/* The two things every expense needs, up front. */}
        <div className="pixel-panel space-y-3 p-3">
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="expense-description">What was it?</FieldLabel>
                <Input
                  {...field}
                  id="expense-description"
                  placeholder="Food order, hotel, groceries…"
                  maxLength={255}
                  autoFocus={!expense}
                  enterKeyHint="next"
                  aria-invalid={fieldState.invalid}
                  className="h-11"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          {method === "items" ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-pixel text-sm">Amount</span>
              <span className="text-muted-foreground text-sm">Adds up from the items below</span>
            </div>
          ) : (
            <Controller
              name="subtotal"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="[&_[data-slot=input-group]]:h-14 [&_input]:font-stat [&_input]:text-3xl"
                >
                  <FieldLabel htmlFor="expense-subtotal">
                    Amount {values.charges.length > 0 && "(before fees and discounts)"}
                  </FieldLabel>
                  <CurrencyInput
                    id="expense-subtotal"
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
          )}
        </div>

        {/* Who paid: one tap on a person, or several people with their amounts. */}
        <FieldSet>
          <FieldLegend className="font-pixel">Who paid?</FieldLegend>
          <div role="group" aria-label="Who paid" className="flex flex-wrap gap-2">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={values.payer_mode === "single" && values.payer_id === p.id}
                onClick={() => {
                  form.setValue("payer_mode", "single");
                  form.setValue("payer_id", p.id);
                  form.clearErrors("payer_id");
                }}
                className={personChipClass}
              >
                {p.name}
                {p.is_me && <span className="opacity-70"> (me)</span>}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={values.payer_mode === "multiple"}
              onClick={() => form.setValue("payer_mode", "multiple")}
              className={personChipClass}
            >
              <Users aria-hidden className="size-4" />
              Several people
            </button>
          </div>
          {form.formState.errors.payer_id ? (
            <FieldError errors={[form.formState.errors.payer_id]} />
          ) : values.payer_mode === "single" ? (
            preview.data && (
              <FieldDescription>
                Paid the whole <MoneyDisplay value={preview.data.total} tone="neutral" />.
              </FieldDescription>
            )
          ) : (
            <div className="space-y-2">
              {people.map((p) => (
                <Controller
                  key={p.id}
                  name={`payer_amounts.${p.id}`}
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid grid-cols-[minmax(0,1fr)_9rem] items-center gap-3">
                      <label htmlFor={`payer-${p.id}`} className="truncate text-sm">
                        {p.name}
                        {p.is_me && <span className="text-muted-foreground"> (me)</span>}
                      </label>
                      <CurrencyInput
                        id={`payer-${p.id}`}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                />
              ))}
              {preview.data && (
                <FieldDescription>
                  The amounts paid must add up to the total,{" "}
                  <MoneyDisplay value={preview.data.total} tone="neutral" />.
                </FieldDescription>
              )}
            </div>
          )}
        </FieldSet>

        {/* How it's split */}
        <FieldSet>
          <FieldLegend className="font-pixel">How is it split?</FieldLegend>
          <Controller
            name="split_method"
            control={form.control}
            render={({ field }) => (
              <div
                role="group"
                aria-label="Split method"
                className={cn(
                  segmentListClass,
                  "grid h-auto w-full grid-cols-3 sm:h-auto sm:grid-cols-6"
                )}
              >
                {SPLIT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={field.value === m}
                    onClick={() => field.onChange(m)}
                    className={cn(segmentClass, "h-10 px-1")}
                  >
                    {SPLIT_LABELS[m].replace(/^By /, "")}
                  </button>
                ))}
              </div>
            )}
          />
          <FieldDescription>{SPLIT_HINTS[method]}</FieldDescription>

          {method === "items" ? (
            <div className="space-y-3">
              {items.fields.map((row, index) => (
                <ItemRow
                  key={row.id}
                  index={index}
                  control={form.control}
                  people={people}
                  lineTotal={preview.data?.line_totals[index]}
                  onRemove={items.fields.length > 1 ? () => items.remove(index) : undefined}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => items.append(blankItem())}
              >
                <Plus aria-hidden />
                Add item
              </Button>
            </div>
          ) : (
            <PartsEditor
              control={form.control}
              prefix="parts"
              people={people}
              method={method}
              resultOf={(id) => allocationOf(id)?.base}
              onSetAll={(included) =>
                people.forEach((p) => form.setValue(`parts.${p.id}.included`, included))
              }
            />
          )}
        </FieldSet>

        {/* Fees and discounts */}
        <FieldSet>
          <FieldLegend className="font-pixel">Fees and discounts</FieldLegend>
          {charges.fields.length === 0 && (
            <FieldDescription>
              Delivery, service charge, tax, a voucher… each one can be split its own way.
            </FieldDescription>
          )}
          {charges.fields.map((row, index) => (
            <ChargeRow
              key={row.id}
              index={index}
              control={form.control}
              people={people}
              onRemove={() => charges.remove(index)}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                charges.append({
                  kind: "delivery",
                  label: "",
                  amount: "",
                  allocation: "equal",
                  parts: blankParts(people, false),
                })
              }
            >
              <Plus aria-hidden />
              Add a fee
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                charges.append({
                  kind: "discount",
                  label: "",
                  amount: "",
                  allocation: "proportional",
                  parts: blankParts(people, false),
                })
              }
            >
              <Plus aria-hidden />
              Add a discount
            </Button>
          </div>
        </FieldSet>

        <Breakdown
          people={people}
          allocations={preview.data?.allocations ?? null}
          total={preview.data?.total ?? null}
          loading={preview.isFetching}
          errors={draft ? previewErrors : []}
          empty={!draft}
        />

        {me && (
          <FieldSet>
            <FieldLegend className="font-pixel">My budget</FieldLegend>
            <Controller
              name="record_share"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="expense-record-share"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="expense-record-share" className="font-normal">
                    Count my share as spending in my budget
                    {allocationOf(me.id) && (
                      <>
                        {" "}
                        (<MoneyDisplay value={allocationOf(me.id)!.total} tone="neutral" />)
                      </>
                    )}
                  </FieldLabel>
                </Field>
              )}
            />
            {values.record_share && (
              <Controller
                name="share_account_id"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="expense-share-account">Paid from (optional)</FieldLabel>
                    <Autocomplete
                      id="expense-share-account"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
                      loading={accounts.isLoading}
                      placeholder="No account: just count the spending"
                      emptyMessage="No accounts match."
                      clearable
                    />
                    <FieldDescription>
                      Only your share counts as spending, under the category above. With an account,
                      what you paid for others (or what others covered for you) moves the account
                      too, as a balance-only adjustment, so the full amount you paid leaves it
                      without being counted as your spending.
                    </FieldDescription>
                  </Field>
                )}
              />
            )}
          </FieldSet>
        )}

        {/* Date, category and notes: sensible defaults, tucked away until someone needs them. */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger className="pixel-box bg-card hover:bg-accent focus-visible:outline-highlight group flex min-h-11 w-full items-center gap-2 px-3 text-left outline-none focus-visible:outline-3">
            <span className="font-pixel text-sm">Details</span>
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-right text-sm">
              {detailsSummary}
            </span>
            <ChevronDown
              className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="grid gap-4 pt-3 sm:grid-cols-2">
            <Controller
              name="expense_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-date">Date</FieldLabel>
                  <Input
                    {...field}
                    id="expense-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="category_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-category">Category (optional)</FieldLabel>
                  <Autocomplete
                    id="expense-category"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={(categories.data ?? []).map((c) => ({
                      value: c.id,
                      label: c.name,
                      color: c.color,
                    }))}
                    loading={categories.isLoading}
                    placeholder="Food, Transport…"
                    emptyMessage="No categories match."
                    invalid={fieldState.invalid}
                    clearable
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="expense-notes">Notes (optional)</FieldLabel>
                  <Textarea {...field} id="expense-notes" rows={2} maxLength={2000} />
                </Field>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {serverErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc pl-4">
                {serverErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </FieldGroup>

      {/* Pinned to the bottom of the dialog or sheet: the total and the button are always in reach. */}
      <div className="bg-card border-outline sticky -bottom-[19px] z-10 -mx-[19px] -mb-[19px] mt-6 flex items-center gap-3 border-t-2 px-[19px] py-3 in-data-[slot=sheet-content]:-bottom-4 in-data-[slot=sheet-content]:-mx-4 in-data-[slot=sheet-content]:-mb-4 in-data-[slot=sheet-content]:px-4">
        <div className="min-w-0 flex-1" aria-live="polite">
          <div className="text-muted-foreground text-xs">
            {preview.isFetching ? "Checking…" : "Total"}
          </div>
          <div className="font-stat truncate text-2xl leading-none">
            {draft && preview.data ? (
              <MoneyDisplay value={preview.data.total} tone="neutral" />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
        <Button type="submit" disabled={submitting} className="h-11 min-w-36">
          {submitting ? "Saving..." : expense ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}

/** One row per participant: ticked or not, plus the method's value; the server's result beside it. */
function PartsEditor({
  control,
  prefix,
  people,
  method,
  resultOf,
  onSetAll,
}: {
  control: Control<ExpenseFormValues>;
  prefix: "parts" | `charges.${number}.parts`;
  people: Participant[];
  method: SplitMethod | "assigned";
  resultOf?: (id: string) => Allocation["base"] | undefined;
  /** Shows "Everyone" / "Nobody" shortcuts above the list. */
  onSetAll?: (included: boolean) => void;
}) {
  const withValue = method !== "equal" && method !== "assigned";
  const unit =
    method === "percent"
      ? "%"
      : method === "shares"
        ? "shares"
        : method === "quantity"
          ? "qty"
          : "";

  const list = (
    <ul className="pixel-box divide-border divide-y-2 divide-dashed">
      {people.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-1">
          <Controller
            name={`${prefix}.${p.id}.included`}
            control={control}
            render={({ field }) => (
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <span className="truncate">
                  {p.name}
                  {p.is_me && <span className="text-muted-foreground"> (me)</span>}
                </span>
              </label>
            )}
          />
          {withValue && (
            <Controller
              name={`${prefix}.${p.id}.value`}
              control={control}
              render={({ field }) =>
                method === "amount" ? (
                  <CurrencyInput
                    aria-label={`${p.name}'s amount`}
                    className="w-37 shrink-0"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    placeholder="0.00"
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      aria-label={`${p.name}'s ${unit}`}
                      inputMode="decimal"
                      className="w-24 tabular-nums"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(toNumberInput(event.target.value))}
                      placeholder="0"
                    />
                    <span className="text-muted-foreground w-12 text-xs">{unit}</span>
                  </div>
                )
              }
            />
          )}
          {resultOf?.(p.id) && (
            <MoneyDisplay
              value={resultOf(p.id)!}
              tone="neutral"
              className="w-24 text-right text-sm tabular-nums"
            />
          )}
        </li>
      ))}
    </ul>
  );

  if (!onSetAll) return list;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1">
        <span className="text-muted-foreground mr-auto text-xs">Who&apos;s in?</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSetAll(true)}>
          Everyone
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSetAll(false)}>
          Nobody
        </Button>
      </div>
      {list}
    </div>
  );
}

function ItemRow({
  index,
  control,
  people,
  lineTotal,
  onRemove,
}: {
  index: number;
  control: Control<ExpenseFormValues>;
  people: Participant[];
  lineTotal?: Allocation["base"];
  onRemove?: () => void;
}) {
  const split = useWatch({ control, name: `items.${index}.split` });
  const ids = useWatch({ control, name: `items.${index}.participant_ids` });
  const chosen = people.filter((p) => ids.includes(p.id));

  return (
    <div className="pixel-box space-y-3 p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_5rem_auto]">
        <Controller
          name={`items.${index}.name`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              aria-label={`Item ${index + 1} name`}
              placeholder="Chicken meal"
              maxLength={150}
            />
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove item ${index + 1}`}
          disabled={!onRemove}
          onClick={onRemove}
          className="sm:order-last"
        >
          <Trash2 aria-hidden />
        </Button>
        <Controller
          name={`items.${index}.unit_price`}
          control={control}
          render={({ field }) => (
            <CurrencyInput
              aria-label={`Item ${index + 1} price each`}
              value={field.value}
              onChange={field.onChange}
              placeholder="Price"
            />
          )}
        />
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <Input
              aria-label={`Item ${index + 1} quantity`}
              inputMode="decimal"
              value={field.value}
              onChange={(event) => field.onChange(toNumberInput(event.target.value))}
              placeholder="Qty"
            />
          )}
        />
      </div>
      <Controller
        name={`items.${index}.participant_ids`}
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Who had it:</span>
            {people.map((p) => {
              const on = field.value.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    field.onChange(
                      on ? field.value.filter((id) => id !== p.id) : [...field.value, p.id]
                    )
                  }
                  className={cn(personChipClass, "h-10 px-2.5")}
                >
                  {p.name}
                </button>
              );
            })}
            {lineTotal && (
              <span className="ml-auto text-sm">
                = <MoneyDisplay value={lineTotal} tone="neutral" />
              </span>
            )}
          </div>
        )}
      />
      {chosen.length >= 2 && (
        <Controller
          name={`items.${index}.split`}
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">Split:</span>
              <div
                role="group"
                aria-label={`How item ${index + 1} is split`}
                className={cn(segmentListClass, "h-auto flex-wrap sm:h-auto")}
              >
                {ITEM_SPLITS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={field.value === s}
                    onClick={() => field.onChange(s)}
                    className={cn(segmentClass, "h-8 px-2 text-xs")}
                  >
                    {ITEM_SPLIT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        />
      )}
      {split !== "equal" && chosen.length >= 2 && (
        <ul className="divide-border divide-y divide-dashed">
          {chosen.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-1.5">
              <span className="min-w-0 flex-1 truncate text-sm">
                {p.name}
                {p.is_me && <span className="text-muted-foreground"> (me)</span>}
              </span>
              <Controller
                name={`items.${index}.values.${p.id}`}
                control={control}
                render={({ field }) =>
                  split === "amount" ? (
                    <CurrencyInput
                      aria-label={`${p.name}'s amount for item ${index + 1}`}
                      className="w-37 shrink-0"
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v)}
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        aria-label={`${p.name}'s shares of item ${index + 1}`}
                        inputMode="decimal"
                        className="w-24 tabular-nums"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(toNumberInput(event.target.value))}
                        placeholder="0"
                      />
                      <span className="text-muted-foreground w-12 text-xs">shares</span>
                    </div>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChargeRow({
  index,
  control,
  people,
  onRemove,
}: {
  index: number;
  control: Control<ExpenseFormValues>;
  people: Participant[];
  onRemove: () => void;
}) {
  const allocation = useWatch({ control, name: `charges.${index}.allocation` });
  const kind = useWatch({ control, name: `charges.${index}.kind` });
  const needsPeople =
    allocation === "amount" || allocation === "shares" || allocation === "assigned";

  return (
    <div className="pixel-box space-y-3 p-3">
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_9rem_auto]">
        <Controller
          name={`charges.${index}.kind`}
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger aria-label="Kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHARGE_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {CHARGE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          name={`charges.${index}.label`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              aria-label="Label (optional)"
              placeholder="Label (optional)"
              maxLength={100}
            />
          )}
        />
        <Controller
          name={`charges.${index}.amount`}
          control={control}
          render={({ field }) => (
            <CurrencyInput
              aria-label={isDiscount(kind) ? "Discount amount" : "Fee amount"}
              value={field.value}
              onChange={field.onChange}
              placeholder="0.00"
            />
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove this fee or discount"
          onClick={onRemove}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      <Controller
        name={`charges.${index}.allocation`}
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {isDiscount(kind) ? "Shared out:" : "Split:"}
            </span>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger aria-label="How it's split" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHARGE_ALLOCATIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {ALLOCATION_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      />
      {needsPeople && (
        <PartsEditor
          control={control}
          prefix={`charges.${index}.parts`}
          people={people}
          method={allocation === "assigned" ? "assigned" : allocation}
        />
      )}
    </div>
  );
}

/** Each person's share as the server split it: base + fees - discounts = what they owe. */
function Breakdown({
  people,
  allocations,
  total,
  loading,
  errors,
  empty,
}: {
  people: Participant[];
  allocations: Allocation[] | null;
  total: Allocation["total"] | null;
  loading: boolean;
  errors: string[];
  empty: boolean;
}) {
  return (
    <section
      aria-labelledby="breakdown-title"
      aria-live="polite"
      className="pixel-panel space-y-2 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="breakdown-title" className="font-pixel text-sm">
          Who owes what
        </h3>
        {loading && <span className="text-muted-foreground text-xs">Checking…</span>}
      </div>
      {empty ? (
        <p className="text-muted-foreground text-sm">
          Enter an amount to see what each person owes.
        </p>
      ) : errors.length > 0 ? (
        <ul className="text-expense list-disc pl-4 text-sm" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : allocations ? (
        // One line per person; fees and discounts only show for those who have any.
        <ul className="divide-border divide-y divide-dashed text-sm tabular-nums">
          {allocations.map((a) => {
            const person = people.find((p) => p.id === a.participant_id);
            const hasFees = /[1-9]/.test(a.charges.amount);
            const hasDiscounts = /[1-9]/.test(a.discounts.amount);
            return (
              <li key={a.participant_id} className="flex items-center gap-3 py-1.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    {person?.name}
                    {person?.is_me && <span className="text-muted-foreground"> (me)</span>}
                  </div>
                  {(hasFees || hasDiscounts) && (
                    <div className="text-muted-foreground text-xs">
                      <MoneyDisplay value={a.base} tone="neutral" />
                      {hasFees && (
                        <>
                          {" + "}
                          <MoneyDisplay value={a.charges} tone="neutral" /> fees
                        </>
                      )}
                      {hasDiscounts && (
                        <>
                          {" − "}
                          <MoneyDisplay value={a.discounts} tone="neutral" /> off
                        </>
                      )}
                    </div>
                  )}
                </div>
                <MoneyDisplay value={a.total} tone="neutral" className="font-medium" />
              </li>
            );
          })}
          {total && (
            <li className="border-outline flex items-center justify-between border-t-2 pt-1.5">
              <span className="font-pixel">Total</span>
              <MoneyDisplay value={total} tone="neutral" className="font-medium" />
            </li>
          )}
        </ul>
      ) : null}
    </section>
  );
}
