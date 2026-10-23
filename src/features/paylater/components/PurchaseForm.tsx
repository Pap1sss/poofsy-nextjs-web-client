"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { segmentClass } from "@/components/ui/segments";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { todayIn } from "@/lib/utils/date";
import { applyApiErrors } from "@/lib/utils/form";

import { DURATION_PRESETS } from "../constant";
import {
  useCashAccounts,
  useCreatePurchase,
  usePaylaterAccounts,
  usePreviewSchedule,
  useSpendingCategories,
  useUpdatePurchase,
} from "../hooks";
import {
  PurchaseDetailsSchema,
  PurchaseFormSchema,
  type PurchaseDetail,
  type PurchaseDetailsValues,
  type PurchaseFormValues,
} from "../schema";
import { AccountForm } from "./AccountForm";
import { ordinal, providerLabel } from "./paylater-bits";
import { ScheduleEditor } from "./ScheduleEditor";

const DETAIL_FIELDS = [
  "paylater_account_id",
  "category_id",
  "description",
  "merchant",
  "order_reference",
  "purchase_date",
  "original_amount",
  "down_payment",
  "fees",
  "other_charges",
  "interest_rate",
  "notes",
] as const;
const CREATE_FIELDS = [
  ...DETAIL_FIELDS,
  "total_repayment",
  "installments",
  "down_payment_account_id",
] as const;

const hasAmount = (value: string | undefined) => !!value && /[1-9]/.test(value);

/** The first `day` of a month after `from` (YYYY-MM-DD), clamped to short months' last day. */
export function nextDueDate(from: string, day: number): string {
  const [y, m, d] = from.split("-").map(Number);
  const onDay = (year: number, month: number) => {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { year, month, day: Math.min(day, last) };
  };
  let due = onDay(y, m);
  if (due.day <= d) due = m === 12 ? onDay(y + 1, 1) : onDay(y, m + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${due.year}-${pad(due.month)}-${pad(due.day)}`;
}

type PurchaseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this purchase's details; omit to record a new one. */
  purchase?: PurchaseDetail | null;
  /** Pre-picks the PayLater account, e.g. from its own page. */
  accountId?: string;
};

export function PurchaseForm({ open, onOpenChange, purchase, accountId }: PurchaseFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={purchase ? "Edit purchase" : "Record a PayLater purchase"}
      size="xl"
    >
      {open &&
        (purchase ? (
          <EditDetailsBody purchase={purchase} onDone={() => onOpenChange(false)} />
        ) : (
          <CreateBody accountId={accountId} onDone={() => onOpenChange(false)} />
        ))}
    </FormShell>
  );
}

function CreateBody({ accountId, onDone }: { accountId?: string; onDone: () => void }) {
  const router = useRouter();
  const { timezone } = useUserSettings();
  const create = useCreatePurchase();
  const preview = usePreviewSchedule();
  const cashAccounts = useCashAccounts();
  const accounts = usePaylaterAccounts("active");

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(PurchaseFormSchema),
    defaultValues: {
      paylater_account_id: accountId ?? "",
      category_id: "",
      description: "",
      merchant: "",
      order_reference: "",
      purchase_date: todayIn(timezone),
      original_amount: "",
      down_payment: "",
      fees: "",
      other_charges: "",
      interest_rate: "",
      total_repayment: "",
      installment_count: "3",
      first_due_date: "",
      installments: [],
      record_down_payment: false,
      down_payment_account_id: "",
      notes: "",
    },
  });

  const [count, downPayment, recordDownPayment, installments, pickedAccount, purchaseDate] =
    useWatch({
      control: form.control,
      name: [
        "installment_count",
        "down_payment",
        "record_down_payment",
        "installments",
        "paylater_account_id",
        "purchase_date",
      ],
    });

  // The account's pay date gives the first due date, unless the user typed their own.
  const dueDay = accounts.data?.find((a) => a.id === pickedAccount)?.due_day ?? null;
  useEffect(() => {
    if (!dueDay || !purchaseDate || form.getFieldState("first_due_date").isDirty) return;
    form.setValue("first_due_date", nextDueDate(purchaseDate, dueDay));
  }, [dueDay, purchaseDate, form]);

  /** Asks the API for an equal split, then lets the user edit it to match the statement. */
  const fillSchedule = () => {
    const v = form.getValues();
    const missing = !hasAmount(v.original_amount)
      ? (["original_amount", "Enter the purchase amount first."] as const)
      : !v.first_due_date
        ? (["first_due_date", "Pick the first due date."] as const)
        : !(Number(v.installment_count) >= 1)
          ? (["installment_count", "Enter how many months."] as const)
          : null;
    if (missing) {
      form.setError(missing[0], { message: missing[1] });
      return;
    }

    preview.mutate(
      {
        original_amount: v.original_amount,
        down_payment: hasAmount(v.down_payment) ? v.down_payment : null,
        fees: hasAmount(v.fees) ? v.fees : null,
        other_charges: hasAmount(v.other_charges) ? v.other_charges : null,
        total_repayment: hasAmount(v.total_repayment) ? v.total_repayment : null,
        installment_count: Number(v.installment_count),
        first_due_date: v.first_due_date,
      },
      {
        onSuccess: (res) => {
          form.setValue("total_repayment", res.data.total_repayment.amount);
          form.setValue(
            "installments",
            res.data.installments.map((i) => ({ due_date: i.due_date, amount: i.amount.amount }))
          );
          form.clearErrors(["installments", "total_repayment"]);
        },
        onError: (error) =>
          applyApiErrors(error, form.setError, [
            "original_amount",
            "first_due_date",
            "installment_count",
          ]),
      }
    );
  };

  const onSubmit = (values: PurchaseFormValues) =>
    create.mutate(values, {
      onSuccess: (res) => {
        toast.success(res.message);
        poof("Plan saved!");
        onDone();
        router.push(routes.paylater.purchase(res.data.id));
      },
      onError: (error) => applyApiErrors(error, form.setError, CREATE_FIELDS),
    });

  const rootError = form.formState.errors.root?.message;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <DetailsFields />

          <fieldset className="pixel-box bg-muted/40 space-y-4 p-4">
            <legend className="font-pixel px-1 text-sm">Payment plan</legend>
            <Controller
              name="installment_count"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="purchase-count">Months to pay</FieldLabel>
                  <div className="flex flex-wrap items-center gap-1">
                    {DURATION_PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={count === String(n)}
                        onClick={() => field.onChange(String(n))}
                        className={`${segmentClass} border-outline/40 h-9`}
                      >
                        {n}
                      </button>
                    ))}
                    <Input
                      id="purchase-count"
                      type="number"
                      min={1}
                      max={60}
                      inputMode="numeric"
                      value={field.value}
                      onChange={field.onChange}
                      className="w-20"
                      aria-label="Other number of months"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>Monthly installments.</FieldDescription>
                  )}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="first_due_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="purchase-first-due">First due date</FieldLabel>
                    <Input
                      {...field}
                      id="purchase-first-due"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        {dueDay
                          ? `The account's pay date: every ${ordinal(dueDay)}.`
                          : "When the first installment is due."}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="total_repayment"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="purchase-total">Total to repay</FieldLabel>
                    <CurrencyInput
                      id="purchase-total"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>Fees and interest included.</FieldDescription>
                    )}
                  </Field>
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={fillSchedule}
              disabled={preview.isPending}
            >
              {preview.isPending ? "Filling..." : "Fill the schedule"}
            </Button>

            {installments.length > 0 ? (
              <ScheduleEditor />
            ) : (
              <p className="text-muted-foreground text-sm">
                Fill the schedule, then change any date or amount to match your provider&apos;s
                statement. The installments must add up to the total to repay.
              </p>
            )}
            {installments.length === 0 && form.formState.errors.installments?.message && (
              <FieldError errors={[form.formState.errors.installments]} />
            )}
          </fieldset>

          {hasAmount(downPayment) && (
            <>
              <Controller
                name="record_down_payment"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="purchase-record-down"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    <div className="space-y-1">
                      <FieldLabel htmlFor="purchase-record-down" className="font-normal">
                        I paid the down payment now; record it as an expense
                      </FieldLabel>
                      <FieldDescription>
                        Uses the category above. The rest counts as spending only as you pay it.
                      </FieldDescription>
                    </div>
                  </Field>
                )}
              />
              {recordDownPayment && (
                <Controller
                  name="down_payment_account_id"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="purchase-down-account">Paid from (optional)</FieldLabel>
                      <Autocomplete
                        id="purchase-down-account"
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
              )}
            </>
          )}

          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Saving..." : "Save purchase"}
          </Button>
        </FieldGroup>
      </form>
    </FormProvider>
  );
}

function EditDetailsBody({ purchase, onDone }: { purchase: PurchaseDetail; onDone: () => void }) {
  const update = useUpdatePurchase();
  const form = useForm<PurchaseDetailsValues>({
    resolver: zodResolver(PurchaseDetailsSchema),
    defaultValues: {
      paylater_account_id: purchase.account.id,
      category_id: purchase.category?.id ?? "",
      description: purchase.description,
      merchant: purchase.merchant ?? "",
      order_reference: purchase.order_reference ?? "",
      purchase_date: purchase.purchase_date,
      original_amount: purchase.original_amount.amount,
      down_payment: purchase.down_payment.amount,
      fees: purchase.fees.amount,
      other_charges: purchase.other_charges.amount,
      interest_rate: purchase.interest_rate?.toString() ?? "",
      notes: purchase.notes ?? "",
    },
  });

  const onSubmit = (values: PurchaseDetailsValues) =>
    update.mutate(
      { id: purchase.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, DETAIL_FIELDS),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <p className="text-muted-foreground text-sm">
            To change due dates or amounts, edit the schedule instead.
            {purchase.down_payment_recorded &&
              " The down payment's expense follows any change here."}
          </p>
          <DetailsFields />
          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save changes"}
          </Button>
        </FieldGroup>
      </form>
    </FormProvider>
  );
}

/** What was bought, from where, for how much: shared by the create and edit forms. */
function DetailsFields() {
  const form = useFormContext<PurchaseDetailsValues>();
  const accounts = usePaylaterAccounts("active");
  const categories = useSpendingCategories();
  const [addingAccount, setAddingAccount] = useState(false);

  const amountField = (
    name: "original_amount" | "down_payment" | "fees" | "other_charges",
    label: string,
    hint?: string
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`purchase-${name}`}>{label}</FieldLabel>
          <CurrencyInput
            id={`purchase-${name}`}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="0.00"
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? (
            <FieldError errors={[fieldState.error]} />
          ) : (
            hint && <FieldDescription>{hint}</FieldDescription>
          )}
        </Field>
      )}
    />
  );

  return (
    <>
      <Controller
        name="paylater_account_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="purchase-account">PayLater account</FieldLabel>
            <Autocomplete
              id="purchase-account"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={(accounts.data ?? []).map((a) => ({ value: a.id, label: providerLabel(a) }))}
              loading={accounts.isLoading}
              placeholder="Choose an account"
              emptyMessage="No accounts match."
              invalid={fieldState.invalid}
              required
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            <Button
              type="button"
              variant="link"
              className="h-auto justify-start px-0"
              onClick={() => setAddingAccount(true)}
            >
              + Add a PayLater account
            </Button>
          </Field>
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="purchase-description">What did you buy?</FieldLabel>
            <Input
              {...field}
              id="purchase-description"
              placeholder="e.g. Rice cooker"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="merchant"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-merchant">Store (optional)</FieldLabel>
              <Input {...field} id="purchase-merchant" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="order_reference"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-order">Order number (optional)</FieldLabel>
              <Input {...field} id="purchase-order" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="purchase_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-date">Purchase date</FieldLabel>
              <Input {...field} id="purchase-date" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {amountField("original_amount", "Purchase amount")}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {amountField("down_payment", "Down payment")}
        {amountField("fees", "Fees")}
        {amountField("other_charges", "Other charges")}
      </div>
      <FieldDescription className="-mt-3">
        Fees are the provider&apos;s service and processing fees. Leave any of these empty if none.
      </FieldDescription>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="interest_rate"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-rate">Interest rate % (optional)</FieldLabel>
              <Input
                {...field}
                id="purchase-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  For your records; put the interest in the total to repay.
                </FieldDescription>
              )}
            </Field>
          )}
        />
        <Controller
          name="category_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="purchase-category">Spending category (optional)</FieldLabel>
              <Autocomplete
                id="purchase-category"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={(categories.data ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                  color: c.color,
                }))}
                loading={categories.isLoading}
                placeholder="No category"
                emptyMessage="No categories match."
                invalid={fieldState.invalid}
                clearable
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>Payments default to it.</FieldDescription>
              )}
            </Field>
          )}
        />
      </div>

      <Controller
        name="notes"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="purchase-notes">Notes (optional)</FieldLabel>
            <Textarea {...field} id="purchase-notes" rows={2} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <AccountForm
        open={addingAccount}
        onOpenChange={setAddingAccount}
        account={null}
        onSaved={(id) => form.setValue("paylater_account_id", id, { shouldValidate: true })}
      />
    </>
  );
}
