"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Autocomplete } from "@/components/shared/autocomplete";
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
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { applyApiErrors } from "@/lib/utils/form";
import { ApiValidationError } from "@/lib/utils/request";

import { useBillAccounts, useSaveBill, useSpendingCategories } from "../hooks";
import {
  BillFormSchema,
  MONTHS,
  REPEATS,
  REPEAT_LABELS,
  WEEKDAYS,
  daysInMonth,
  describeRRule,
  parseRRule,
  type Bill,
  type BillFormValues,
} from "../schema";

const FIELDS = [
  "name",
  "amount",
  "category_id",
  "account_id",
  "start_date",
  "reminder_days_before",
  "notes",
  "active",
] as const;

const todayIn = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());

function defaults(bill: Bill | null, today: string): BillFormValues {
  const parsed = bill ? parseRRule(bill.recurrence) : null;
  const startDay = String(Number((bill?.start_date ?? today).slice(8, 10)));

  return {
    name: bill?.name ?? "",
    amount: bill?.amount.amount ?? "",
    category_id: bill?.category?.id ?? "",
    account_id: bill?.account?.id ?? "",
    custom_rule: bill && !parsed ? bill.recurrence : "",
    repeat: parsed?.repeat ?? "monthly",
    weekday: parsed?.weekday ?? "MO",
    month_day: parsed?.month_day ?? startDay,
    month: parsed?.month ?? String(Number(today.slice(5, 7))),
    start_date: bill?.start_date ?? today,
    reminder_days_before: String(bill?.reminder_days_before ?? 3),
    notes: bill?.notes ?? "",
    active: bill?.active ?? true,
  };
}

const ordinalDay = (day: number) => {
  const suffix =
    day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th");
  return `${day}${suffix}`;
};

type BillFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to add a new bill. */
  bill: Bill | null;
};

export function BillForm({ open, onOpenChange, bill }: BillFormProps) {
  return (
    <FormShell open={open} onOpenChange={onOpenChange} title={bill ? "Edit bill" : "Add bill"}>
      {open && (
        <BillFormBody key={bill?.id ?? "new"} bill={bill} onDone={() => onOpenChange(false)} />
      )}
    </FormShell>
  );
}

function BillFormBody({ bill, onDone }: { bill: Bill | null; onDone: () => void }) {
  const { timezone } = useUserSettings();
  const save = useSaveBill();
  const accounts = useBillAccounts();
  const categories = useSpendingCategories();

  // Keep a now-archived category or account selectable when editing, so saving doesn't drop it.
  const withCurrent = (
    items: { id: string; name: string }[] | undefined,
    current: { id: string; name: string } | null | undefined
  ) =>
    [
      ...(current && !items?.some((i) => i.id === current.id) ? [current] : []),
      ...(items ?? []),
    ].map((i) => ({ value: i.id, label: i.name }));
  const categoryOptions = withCurrent(categories.data, bill?.category);
  const accountOptions = withCurrent(accounts.data, bill?.account);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(BillFormSchema),
    defaultValues: defaults(bill, todayIn(timezone)),
  });

  const [repeat, month, customRule] = useWatch({
    control: form.control,
    name: ["repeat", "month", "custom_rule"],
  });
  const dayCount = repeat === "yearly" ? daysInMonth(Number(month)) : 31;

  const onSubmit = (values: BillFormValues) =>
    save.mutate(
      { id: bill?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => {
          applyApiErrors(error, form.setError, FIELDS);
          // `recurrence` has no field of its own; show its message on the repeat control.
          if (error instanceof ApiValidationError && error.errors.recurrence) {
            form.setError("repeat", { message: error.errors.recurrence[0] });
          }
        },
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
              <FieldLabel htmlFor="bill-name">Name</FieldLabel>
              <Input
                {...field}
                id="bill-name"
                placeholder="Internet, Electricity, Rent"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bill-amount">Usual amount</FieldLabel>
              <CurrencyInput
                id="bill-amount"
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
                  You can enter the exact amount each time you pay.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        {customRule ? (
          <Field>
            <FieldLabel>Repeats</FieldLabel>
            <p className="text-sm">{describeRRule(customRule)}</p>
            <FieldDescription>
              This schedule was set up outside the usual options and is kept as it is.{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => form.setValue("custom_rule", "")}
              >
                Choose a new schedule
              </button>
            </FieldDescription>
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="repeat"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bill-repeat">Repeats</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="bill-repeat"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPEATS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {REPEAT_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {repeat === "weekly" ? (
              <Controller
                name="weekday"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="bill-weekday">On</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="bill-weekday" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map(([code, label]) => (
                          <SelectItem key={code} value={code}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:col-span-1">
                {repeat === "yearly" && (
                  <Controller
                    name="month"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="bill-month">Month</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            const max = daysInMonth(Number(v));
                            if (Number(form.getValues("month_day")) > max) {
                              form.setValue("month_day", String(max));
                            }
                          }}
                        >
                          <SelectTrigger id="bill-month" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((name, i) => (
                              <SelectItem key={name} value={String(i + 1)}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                )}
                <Controller
                  name="month_day"
                  control={form.control}
                  render={({ field }) => (
                    <Field className={repeat === "yearly" ? "" : "col-span-2"}>
                      <FieldLabel htmlFor="bill-day">Day</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="bill-day" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={String(day)}>
                              {repeat !== "yearly" && day === 31 ? "Last day" : ordinalDay(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="start_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="bill-start">Starting from</FieldLabel>
                <Input {...field} id="bill-start" type="date" aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>The first due date is on or after this.</FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            name="reminder_days_before"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="bill-reminder">Remind me (days before)</FieldLabel>
                <Input
                  {...field}
                  id="bill-reminder"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={30}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    In the app and by email. 0 reminds you on the day.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="category_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bill-category">Category (optional)</FieldLabel>
              <Autocomplete
                id="bill-category"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={categoryOptions}
                loading={categories.isLoading}
                placeholder="No category"
                emptyMessage="No categories match."
                invalid={fieldState.invalid}
                clearable
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Payments count toward this category in your budget.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name="account_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bill-account">Usually paid from (optional)</FieldLabel>
              <Autocomplete
                id="bill-account"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={accountOptions}
                loading={accounts.isLoading}
                placeholder="Choose each time"
                emptyMessage="No accounts match."
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
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bill-notes">Notes (optional)</FieldLabel>
              <Textarea
                {...field}
                id="bill-notes"
                rows={2}
                placeholder="Account number, how to pay"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {bill && (
          <Controller
            name="active"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id="bill-active"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <div className="space-y-1">
                  <FieldLabel htmlFor="bill-active" className="font-normal">
                    Active
                  </FieldLabel>
                  <FieldDescription>
                    Turn off to stop reminders and future due dates. Paid history is kept.
                  </FieldDescription>
                </div>
              </Field>
            )}
          />
        )}

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : bill ? "Save changes" : "Add bill"}
        </Button>
      </FieldGroup>
    </form>
  );
}
