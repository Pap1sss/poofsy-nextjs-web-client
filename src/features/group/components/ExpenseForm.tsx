"use client";

import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { poof } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { todayIn } from "@/lib/utils/date";
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
      items: [{ name: "", unit_price: "", quantity: "1", participant_ids: [] }],
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
        }))
      : [{ name: "", unit_price: "", quantity: "1", participant_ids: [] }],
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                <FieldLabel htmlFor="expense-description">What was it?</FieldLabel>
                <Input
                  {...field}
                  id="expense-description"
                  placeholder="Food order, hotel, groceries…"
                  maxLength={255}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="expense_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="expense-date">Date</FieldLabel>
                <Input {...field} id="expense-date" type="date" aria-invalid={fieldState.invalid} />
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
        </div>

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
                className={cn(segmentListClass, "h-auto w-full flex-wrap sm:h-auto")}
              >
                {SPLIT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={field.value === m}
                    onClick={() => field.onChange(m)}
                    className={cn(segmentClass, "h-9 flex-1")}
                  >
                    {SPLIT_LABELS[m]}
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
                onClick={() =>
                  items.append({ name: "", unit_price: "", quantity: "1", participant_ids: [] })
                }
              >
                <Plus aria-hidden />
                Add item
              </Button>
            </div>
          ) : (
            <>
              <Controller
                name="subtotal"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
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
              <PartsEditor
                control={form.control}
                prefix="parts"
                people={people}
                method={method}
                resultOf={(id) => allocationOf(id)?.base}
              />
            </>
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

        {/* Who paid */}
        <FieldSet>
          <FieldLegend className="font-pixel">Who paid?</FieldLegend>
          <Controller
            name="payer_mode"
            control={form.control}
            render={({ field }) => (
              <div role="group" aria-label="Who paid" className={segmentListClass}>
                <button
                  type="button"
                  aria-pressed={field.value === "single"}
                  className={segmentClass}
                  onClick={() => field.onChange("single")}
                >
                  One person
                </button>
                <button
                  type="button"
                  aria-pressed={field.value === "multiple"}
                  className={segmentClass}
                  onClick={() => field.onChange("multiple")}
                >
                  Several people
                </button>
              </div>
            )}
          />
          {values.payer_mode === "single" ? (
            <Controller
              name="payer_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-payer">Paid by</FieldLabel>
                  <Autocomplete
                    id="expense-payer"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={people.map((p) => ({
                      value: p.id,
                      label: p.is_me ? `${p.name} (me)` : p.name,
                    }))}
                    placeholder="Choose who paid"
                    emptyMessage="Nobody matches."
                    invalid={fieldState.invalid}
                    required
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    preview.data && (
                      <FieldDescription>
                        Paid the whole <MoneyDisplay value={preview.data.total} tone="neutral" />.
                      </FieldDescription>
                    )
                  )}
                </Field>
              )}
            />
          ) : (
            <div className="space-y-2">
              {people.map((p) => (
                <Controller
                  key={p.id}
                  name={`payer_amounts.${p.id}`}
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-3">
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

        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="expense-notes">Notes (optional)</FieldLabel>
              <Textarea {...field} id="expense-notes" rows={2} maxLength={2000} />
            </Field>
          )}
        />

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

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : expense ? "Save changes" : "Add expense"}
        </Button>
      </FieldGroup>
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
}: {
  control: Control<ExpenseFormValues>;
  prefix: "parts" | `charges.${number}.parts`;
  people: Participant[];
  method: SplitMethod | "assigned";
  resultOf?: (id: string) => Allocation["base"] | undefined;
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

  return (
    <ul className="pixel-box divide-border divide-y-2 divide-dashed">
      {people.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
          <Controller
            name={`${prefix}.${p.id}.included`}
            control={control}
            render={({ field }) => (
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
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
                    className="w-32"
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
                  className={cn(segmentClass, "pixel-box bg-card h-8 px-2 text-xs")}
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
          Breakdown
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs">
                <th className="py-1 font-normal">Person</th>
                <th className="py-1 text-right font-normal">Base</th>
                <th className="py-1 text-right font-normal">Fees</th>
                <th className="py-1 text-right font-normal">Discounts</th>
                <th className="py-1 text-right font-normal">Owes</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {allocations.map((a) => (
                <tr key={a.participant_id} className="border-border border-t border-dashed">
                  <td className="py-1">{people.find((p) => p.id === a.participant_id)?.name}</td>
                  <td className="py-1 text-right">
                    <MoneyDisplay value={a.base} tone="neutral" />
                  </td>
                  <td className="py-1 text-right">
                    <MoneyDisplay value={a.charges} tone="neutral" />
                  </td>
                  <td className="py-1 text-right">
                    <MoneyDisplay value={a.discounts} tone="neutral" />
                  </td>
                  <td className="py-1 text-right font-medium">
                    <MoneyDisplay value={a.total} tone="neutral" />
                  </td>
                </tr>
              ))}
            </tbody>
            {total && (
              <tfoot>
                <tr className="border-outline border-t-2">
                  <td className="font-pixel py-1" colSpan={4}>
                    Total
                  </td>
                  <td className="py-1 text-right font-medium">
                    <MoneyDisplay value={total} tone="neutral" />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : null}
    </section>
  );
}
