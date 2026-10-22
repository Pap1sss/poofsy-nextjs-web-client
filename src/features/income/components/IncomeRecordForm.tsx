"use client";

import { Controller, useFieldArray, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSettings } from "@/features/auth";
import { useFormatMoney } from "@/components/shared/money-display";
import { applyApiErrors } from "@/lib/utils/form";
import { todayIn } from "@/lib/utils/date";

import {
  useAccountOptions,
  useActiveIncomeSources,
  useDeductionTypeOptions,
  useSaveIncomeRecord,
} from "../hooks";
import { IncomeRecordFormSchema, type IncomeRecord, type IncomeRecordFormValues } from "../schema";

type IncomeRecordFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set to edit an existing payslip; omit to record a new one. */
  record?: IncomeRecord | null;
};

const toFormValues = (record: IncomeRecord): IncomeRecordFormValues => ({
  income_source_id: record.income_source?.id ?? "",
  account_id: record.account?.id ?? "",
  pay_date: record.pay_date,
  gross: record.gross.amount,
  deductions: record.deductions.map((line) => ({
    deduction_type_id: line.deduction_type?.id ?? "",
    amount: line.amount.amount,
  })),
  notes: record.notes ?? "",
});

export function IncomeRecordForm({ open, onOpenChange, record }: IncomeRecordFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={record ? "Edit payslip" : "Record income"}
      size="xl"
    >
      {/* Keyed so reopening for another payslip starts from that payslip's values. */}
      {open && (
        <IncomeRecordFormBody
          key={record?.id ?? "new"}
          record={record}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function IncomeRecordFormBody({
  record,
  onDone,
}: {
  record?: IncomeRecord | null;
  onDone: () => void;
}) {
  const { timezone } = useUserSettings();
  const format = useFormatMoney();
  const sources = useActiveIncomeSources();
  const accounts = useAccountOptions();
  const deductionTypes = useDeductionTypeOptions();
  const { mutate: save, isPending } = useSaveIncomeRecord();

  const toOptions = (items?: { id: string; name: string }[]) =>
    (items ?? []).map((item) => ({ value: item.id, label: item.name }));
  const sourceOptions = toOptions(sources.data);
  const accountOptions = toOptions(accounts.data);
  // Built once and shared by every deduction row.
  const deductionTypeOptions = toOptions(deductionTypes.data);

  const form = useForm<IncomeRecordFormValues>({
    resolver: zodResolver(IncomeRecordFormSchema),
    defaultValues: record
      ? toFormValues(record)
      : {
          income_source_id: "",
          account_id: "",
          pay_date: todayIn(timezone),
          gross: "",
          deductions: [],
          notes: "",
        },
  });

  const lines = useFieldArray({ control: form.control, name: "deductions" });

  const onSubmit = (values: IncomeRecordFormValues) => {
    const fields = [
      "income_source_id",
      "account_id",
      "pay_date",
      "gross",
      "deductions",
      "notes",
      ...values.deductions.flatMap((_, i) => [
        `deductions.${i}.deduction_type_id`,
        `deductions.${i}.amount`,
      ]),
    ] as Path<IncomeRecordFormValues>[];

    save(
      { id: record?.id, values },
      {
        onSuccess: (res) => {
          toast.success(`${res.message} Net pay: ${format(res.data.net)}.`);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, fields),
      }
    );
  };

  const rootError = form.formState.errors.root?.message;
  const deductionsError = form.formState.errors.deductions?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="income_source_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="income-source">Income source</FieldLabel>
                <Autocomplete
                  id="income-source"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={sourceOptions}
                  loading={sources.isLoading}
                  placeholder="No source"
                  emptyMessage="No sources match."
                  clearable
                  invalid={fieldState.invalid}
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
                <FieldLabel htmlFor="income-account">Paid into</FieldLabel>
                <Autocomplete
                  id="income-account"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={accountOptions}
                  loading={accounts.isLoading}
                  placeholder="Choose an account"
                  emptyMessage="No accounts match."
                  required
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="pay_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="income-pay-date">Pay date</FieldLabel>
                <Input
                  {...field}
                  id="income-pay-date"
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="gross"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="income-gross">Gross pay</FieldLabel>
                <CurrencyInput
                  id="income-gross"
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
        </div>

        <fieldset className="space-y-3">
          <legend className="font-pixel text-base">Deductions</legend>
          {lines.fields.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No deductions. Add SSS, PhilHealth, tax and others as they appear on your payslip.
            </p>
          )}

          {lines.fields.map((line, index) => (
            <div
              key={line.id}
              className="pixel-box bg-muted/50 grid grid-cols-[1fr_auto] gap-2 p-2 sm:grid-cols-[1fr_10rem_auto]"
            >
              <Controller
                name={`deductions.${index}.deduction_type_id`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="col-span-2 sm:col-span-1">
                    <Autocomplete
                      aria-label={`Deduction ${index + 1} type`}
                      value={field.value}
                      onBlur={field.onBlur}
                      options={deductionTypeOptions}
                      loading={deductionTypes.isLoading}
                      placeholder="Other deduction"
                      emptyMessage="No deduction types match."
                      clearable
                      invalid={fieldState.invalid}
                      onChange={(id) => {
                        field.onChange(id);
                        // Pre-fill the type's usual amount, but never overwrite one already typed.
                        const preset = deductionTypes.data?.find(
                          (t) => t.id === id
                        )?.default_amount;
                        if (preset && !form.getValues(`deductions.${index}.amount`)) {
                          form.setValue(`deductions.${index}.amount`, preset.amount);
                        }
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name={`deductions.${index}.amount`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-label={`Deduction ${index + 1} amount`}
                      aria-invalid={fieldState.invalid}
                      placeholder="0.00"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 sm:size-9"
                aria-label={`Remove deduction ${index + 1}`}
                onClick={() => lines.remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          {deductionsError && <p className="text-destructive text-sm">{deductionsError}</p>}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => lines.append({ deduction_type_id: "", amount: "" })}
            disabled={lines.fields.length >= 20}
          >
            <Plus className="size-4" aria-hidden />
            Add deduction
          </Button>
        </fieldset>

        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="income-notes">Notes</FieldLabel>
              <Textarea {...field} id="income-notes" rows={2} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {rootError && (
        <Alert variant="destructive">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}

      <div className="border-outline flex flex-col-reverse gap-3 border-t-2 border-dashed pt-4 sm:flex-row sm:items-center sm:justify-between">
        <FieldDescription>
          Net is worked out when you save: gross pay minus deductions.
        </FieldDescription>
        <Button type="submit" disabled={isPending} className="min-h-11 sm:min-h-9">
          {isPending ? "Saving..." : record ? "Save changes" : "Record income"}
        </Button>
      </div>
    </form>
  );
}
