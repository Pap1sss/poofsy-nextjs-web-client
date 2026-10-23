"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { applyApiErrors } from "@/lib/utils/form";

import { useUpdatePrefs } from "../hooks";
import { PrefsFormSchema, type PaylaterPrefs, type PrefsFormValues } from "../schema";

const FIELDS = ["reminder_days_before", "monthly_limit", "budget_percent"] as const;

/** Reminders (in the app and by email) and the heavy-month warnings. Warnings inform; they never block. */
export function SettingsDialog({
  prefs,
  onOpenChange,
}: {
  /** The current settings; null closes. */
  prefs: PaylaterPrefs | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <FormShell open={!!prefs} onOpenChange={onOpenChange} title="Reminders and warnings" size="md">
      {prefs && <SettingsBody prefs={prefs} onDone={() => onOpenChange(false)} />}
    </FormShell>
  );
}

function SettingsBody({ prefs, onDone }: { prefs: PaylaterPrefs; onDone: () => void }) {
  const update = useUpdatePrefs();
  const form = useForm<PrefsFormValues>({
    resolver: zodResolver(PrefsFormSchema),
    defaultValues: {
      reminders_on: prefs.reminder_days_before !== null,
      reminder_days_before: String(prefs.reminder_days_before ?? 3),
      remind_due_today: prefs.remind_due_today,
      remind_overdue: prefs.remind_overdue,
      monthly_limit: prefs.monthly_limit?.amount ?? "",
      budget_percent: prefs.budget_percent?.toString() ?? "",
    },
  });
  const remindersOn = useWatch({ control: form.control, name: "reminders_on" });

  const onSubmit = (values: PrefsFormValues) =>
    update.mutate(values, {
      onSuccess: (res) => {
        toast.success(res.message);
        onDone();
      },
      onError: (error) => applyApiErrors(error, form.setError, FIELDS),
    });

  const check = (name: "reminders_on" | "remind_due_today" | "remind_overdue", label: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <Field orientation="horizontal">
          <Checkbox
            id={`prefs-${name}`}
            checked={field.value}
            onCheckedChange={(v) => field.onChange(v === true)}
          />
          <FieldLabel htmlFor={`prefs-${name}`} className="font-normal">
            {label}
          </FieldLabel>
        </Field>
      )}
    />
  );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <p className="text-muted-foreground text-sm">
          Reminders arrive in your notifications and by email, once each.
        </p>

        {check("reminders_on", "Remind me before an installment is due")}
        {remindersOn && (
          <Controller
            name="reminder_days_before"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="prefs-days">Days before</FieldLabel>
                <Input
                  {...field}
                  id="prefs-days"
                  type="number"
                  min={0}
                  max={30}
                  inputMode="numeric"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
        {check("remind_due_today", "Remind me on the due date")}
        {check("remind_overdue", "Tell me when an installment is overdue")}

        <Controller
          name="monthly_limit"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="prefs-limit">
                Warn me when a month&apos;s PayLater passes
              </FieldLabel>
              <CurrencyInput
                id="prefs-limit"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="No limit"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>Shown on this page and sent once that month.</FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name="budget_percent"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="prefs-percent">Budget planner warning (% of income)</FieldLabel>
              <Input
                {...field}
                id="prefs-percent"
                type="number"
                min={1}
                max={100}
                inputMode="numeric"
                placeholder="Off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Warns when a cutoff&apos;s PayLater passes this share of its income. Leave empty
                  to turn it off.
                </FieldDescription>
              )}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save"}
        </Button>
      </FieldGroup>
    </form>
  );
}
