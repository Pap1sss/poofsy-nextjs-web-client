"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Sprite } from "@/components/pixel/sprites";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserSettings } from "@/features/auth";
import { dayLabel, describePaySchedule } from "@/features/onboarding/pay-summary";
import { applyApiErrors } from "@/lib/utils/form";
import { todayIn } from "@/lib/utils/date";
import { ApiConflictError } from "@/lib/utils/request";

import { useChangePaySchedule, usePaydayPreview } from "../hooks";
import {
  PayScheduleFormSchema,
  usesAnchor,
  type PaySchedule,
  type PayScheduleFormValues,
} from "../schema";
import { PaydayList } from "./PaydayList";

const SCHEDULE_CHOICES = [
  {
    value: "semi_monthly",
    label: "Twice a month",
    description: "Two fixed dates, like the 15th and 30th",
  },
  { value: "monthly", label: "Once a month", description: "One fixed date every month" },
  { value: "weekly", label: "Every week", description: "Same weekday every week" },
  { value: "biweekly", label: "Every two weeks", description: "Same weekday, every other week" },
] as const;

const WEEKEND_CHOICES = [
  { value: "previous_business_day", label: "The business day before" },
  { value: "next_business_day", label: "The business day after" },
  { value: "as_scheduled", label: "On the weekend day itself" },
] as const;

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function defaults(current: PaySchedule | null, today: string): PayScheduleFormValues {
  const known = SCHEDULE_CHOICES.some((c) => c.value === current?.type);

  return {
    type: known ? (current!.type as PayScheduleFormValues["type"]) : "semi_monthly",
    pay_days: known && current?.pay_days?.length ? current.pay_days : [15, 31],
    anchor_date: current?.anchor_date ?? "",
    weekend_rule: current?.weekend_rule ?? "previous_business_day",
    effective_from: today,
  };
}

export function PayScheduleForm({
  current,
  onDone,
}: {
  current: PaySchedule | null;
  onDone: () => void;
}) {
  const { timezone } = useUserSettings();
  const { mutate: change, isPending } = useChangePaySchedule();

  const form = useForm<PayScheduleFormValues>({
    resolver: zodResolver(PayScheduleFormSchema),
    defaultValues: defaults(current, todayIn(timezone)),
  });

  const values = useWatch({ control: form.control }) as PayScheduleFormValues;
  const preview = usePaydayPreview(values);

  const onSubmit = (data: PayScheduleFormValues) =>
    change(data, {
      onSuccess: (res) => {
        toast.success(res.message);
        onDone();
      },
      onError: (error) => {
        // A 409 means budgets already exist for cutoffs after this date; the fix is the date.
        if (error instanceof ApiConflictError) {
          form.setError("effective_from", { message: error.message });
          return;
        }
        applyApiErrors(error, form.setError, [
          "type",
          "pay_days",
          "anchor_date",
          "weekend_rule",
          "effective_from",
        ]);
      },
    });

  const rootError = form.formState.errors.root?.message;
  const isDayType = values.type === "semi_monthly" || values.type === "monthly";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
      <FieldGroup>
        <Field>
          <FieldLabel id="schedule-type-label">How often are you paid?</FieldLabel>
          <ChoiceCards
            aria-labelledby="schedule-type-label"
            value={values.type}
            onValueChange={(type) => {
              form.setValue("type", type);
              form.setValue("pay_days", type === "semi_monthly" ? [15, 31] : [31]);
            }}
            choices={SCHEDULE_CHOICES}
          />
        </Field>

        {isDayType && (
          <Controller
            name="pay_days"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{values.type === "semi_monthly" ? "Paydays" : "Payday"}</FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  {(values.type === "semi_monthly" ? [0, 1] : [0]).map((slot) => (
                    <Select
                      key={slot}
                      value={String(field.value[slot] ?? 31)}
                      onValueChange={(day) => {
                        const days = [...field.value];
                        days[slot] = Number(day);
                        field.onChange(days);
                      }}
                    >
                      <SelectTrigger
                        className="w-40"
                        aria-label={slot === 0 ? "First payday" : "Second payday"}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {day === 31 ? "Last day" : dayLabel(day).replace("the ", "")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

        {usesAnchor(values.type) && (
          <Controller
            name="anchor_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="max-w-60">
                <FieldLabel htmlFor="schedule-anchor">Your most recent payday</FieldLabel>
                <Input
                  {...field}
                  id="schedule-anchor"
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

        <Field>
          <FieldLabel id="weekend-label">
            If a payday falls on a weekend, you&apos;re paid
          </FieldLabel>
          <ChoiceCards
            aria-labelledby="weekend-label"
            className="sm:grid-cols-3"
            value={values.weekend_rule}
            onValueChange={(rule) => form.setValue("weekend_rule", rule)}
            choices={WEEKEND_CHOICES}
          />
        </Field>

        <Controller
          name="effective_from"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="max-w-md">
              <FieldLabel htmlFor="schedule-from">Starts on</FieldLabel>
              <Input
                {...field}
                id="schedule-from"
                type="date"
                className="max-w-60"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Cutoffs before this date stay as they are. Later ones follow the new schedule.
                </FieldDescription>
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <section aria-labelledby="preview-heading" className="space-y-3">
        <div className="flex items-end gap-3">
          <Sprite name="mascot" size={36} className="shrink-0" />
          <p className="pixel-box bg-card max-w-prose px-4 py-3 text-lg leading-relaxed font-medium text-balance">
            {describePaySchedule({ regular_pay: true, pay_schedule: values })}
          </p>
        </div>
        <h3 id="preview-heading" className="text-muted-foreground text-sm">
          Your next six paydays from the start date
        </h3>
        {preview.isError ? (
          <p className="text-expense text-sm">
            Couldn&apos;t preview paydays: {preview.error.message}
          </p>
        ) : (
          <PaydayList dates={preview.data} isLoading={preview.isFetching} />
        )}
      </section>

      {rootError && (
        <Alert variant="destructive">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}

      <div className="border-outline flex flex-col-reverse gap-2 border-t-2 border-dashed pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="min-h-11 sm:min-h-9">
          {isPending ? "Saving..." : "Save pay schedule"}
        </Button>
      </div>
    </form>
  );
}
