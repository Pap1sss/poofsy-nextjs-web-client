"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { useUserSettings } from "@/features/auth";
import { applyApiErrors } from "@/lib/utils/form";
import { todayIn } from "@/lib/utils/date";

import { FREQUENCIES, SOURCE_TYPES } from "../constant";
import { useSaveIncomeSource } from "../hooks";
import { IncomeSourceFormSchema, type IncomeSource, type IncomeSourceFormValues } from "../schema";

type IncomeSourceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: IncomeSource | null;
};

export function IncomeSourceForm({ open, onOpenChange, source }: IncomeSourceFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={source ? `Edit ${source.name}` : "Add income source"}
    >
      {open && (
        <IncomeSourceFormBody
          key={source?.id ?? "new"}
          source={source}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function IncomeSourceFormBody({
  source,
  onDone,
}: {
  source?: IncomeSource | null;
  onDone: () => void;
}) {
  const { timezone } = useUserSettings();
  const { mutate: save, isPending } = useSaveIncomeSource();

  const form = useForm<IncomeSourceFormValues>({
    resolver: zodResolver(IncomeSourceFormSchema),
    defaultValues: source
      ? {
          name: source.name,
          type: source.type,
          expected_gross: source.expected_gross.amount,
          expected_net: source.expected_net.amount,
          frequency: source.frequency,
          effective_from: source.effective_from,
        }
      : {
          name: "",
          type: "salary",
          expected_gross: "",
          expected_net: "",
          frequency: "per_pay_period",
          effective_from: todayIn(timezone),
        },
  });

  const onSubmit = (values: IncomeSourceFormValues) =>
    save(
      { id: source?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) =>
          applyApiErrors(error, form.setError, [
            "name",
            "type",
            "expected_gross",
            "expected_net",
            "frequency",
            "effective_from",
          ]),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="source-name">Name</FieldLabel>
              <Input
                {...field}
                id="source-name"
                placeholder="Salary from work"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="source-type">Type</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="source-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="frequency"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="source-frequency">How often</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="source-frequency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="expected_gross"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="source-gross">Expected gross</FieldLabel>
                <CurrencyInput
                  id="source-gross"
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
            name="expected_net"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="source-net">Expected take-home</FieldLabel>
                <CurrencyInput
                  id="source-net"
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

        <Controller
          name="effective_from"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="max-w-60">
              <FieldLabel htmlFor="source-from">Pay started on</FieldLabel>
              <Input {...field} id="source-from" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Budgets for cutoffs from this date expect this pay.
                </FieldDescription>
              )}
            </Field>
          )}
        />
      </FieldGroup>

      {rootError && (
        <Alert variant="destructive">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}

      <div className="border-outline flex justify-end border-t-2 border-dashed pt-4">
        <Button type="submit" disabled={isPending} className="min-h-11 sm:min-h-9">
          {isPending ? "Saving..." : source ? "Save changes" : "Add income source"}
        </Button>
      </div>
    </form>
  );
}
