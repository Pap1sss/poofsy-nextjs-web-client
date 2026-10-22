"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";

import AppLogo from "@/components/app-logo";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { Autocomplete } from "@/components/shared/autocomplete";
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
import { config } from "@/config";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { cn } from "@/lib/utils/component";
import { applyApiErrors } from "@/lib/utils/form";
import { ApiValidationError } from "@/lib/utils/request";

import { useCompleteOnboarding, usePresets } from "../hooks";
import { dayLabel, describePaySchedule } from "../pay-summary";
import { OnboardingSchema, type OnboardingValues, type Preset } from "../schema";

const STEPS = [
  {
    title: "Where you're based",
    lead: "Your region sets up starter categories, payment methods and payroll deductions. You can change all of them later.",
    fields: ["preset", "currency", "timezone"],
  },
  {
    title: "When you get paid",
    lead: "Every budget runs from one payday to the next, so this decides how your cutoffs are split.",
    fields: ["regular_pay", "pay_schedule"],
  },
  {
    title: "Check and finish",
    lead: "Here's what we'll set up. Nothing is locked in: every setting stays editable.",
    fields: [],
  },
] as const satisfies readonly {
  title: string;
  lead: string;
  fields: readonly Path<OnboardingValues>[];
}[];

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

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
const currencyLabel = (code: string) => `${currencyNames.of(code) ?? code} (${code})`;

function presetDefaults(preset: Preset, current?: OnboardingValues): OnboardingValues {
  return {
    preset: preset.key,
    currency: preset.currency,
    // A generic preset can't guess the zone, so start from the browser's.
    timezone: preset.key === "generic" ? browserTimeZone() : preset.timezone,
    regular_pay: current?.regular_pay ?? true,
    pay_schedule: {
      type: preset.pay_schedule.type,
      pay_days: preset.pay_schedule.pay_days,
      anchor_date: current?.pay_schedule.anchor_date ?? "",
      weekend_rule: preset.pay_schedule.weekend_rule,
    },
  };
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { data: auth } = useAuth();
  const presets = usePresets();
  const onboarded = auth?.data?.onboarded ?? false;

  useEffect(() => {
    if (onboarded) router.replace(routes.dashboard.home);
  }, [onboarded, router]);

  if (onboarded) return <Loading />;
  if (presets.isError) return <Error message={presets.error.message} />;
  if (!presets.data) return <Loading />;

  return <Wizard presets={presets.data} email={auth?.data?.email ?? ""} />;
}

function Wizard({ presets, email }: { presets: Preset[]; email: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { mutate: complete, isPending } = useCompleteOnboarding();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: presetDefaults(presets[0]),
  });

  const values = useWatch({ control: form.control }) as OnboardingValues;
  const currencies = useMemo(
    () =>
      Intl.supportedValuesOf("currency").map((code) => ({
        value: code,
        label: currencyLabel(code),
      })),
    []
  );
  const timeZones = useMemo(
    () => Intl.supportedValuesOf("timeZone").map((zone) => ({ value: zone, label: zone })),
    []
  );
  const presetName = presets.find((p) => p.key === values.preset)?.name ?? "";

  // Keep focus order sensible: each step starts at its heading.
  useEffect(() => {
    document.getElementById("onboarding-step-title")?.focus();
  }, [step]);

  const choosePreset = (key: string) => {
    const preset = presets.find((p) => p.key === key);
    if (preset) form.reset(presetDefaults(preset, form.getValues()));
  };

  const next = async () => {
    if (await form.trigger([...STEPS[step].fields])) setStep(step + 1);
  };

  const finish = form.handleSubmit((data) =>
    complete(data, {
      onSuccess: () => router.replace(routes.dashboard.home),
      onError: (error) => {
        applyApiErrors(error, form.setError, ["preset", "currency", "timezone"]);
        // Send the person back to the step that holds the rejected field.
        if (error instanceof ApiValidationError) {
          const fields = Object.keys(error.errors);
          if (fields.some((f) => !f.startsWith("pay_schedule"))) setStep(0);
          else if (fields.length) setStep(1);
        }
      },
    })
  );

  const rootError = form.formState.errors.root?.message;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-svh">
      <header className="bg-card border-outline flex h-16 items-center justify-between border-b-3 px-4 md:px-8">
        <span className="font-pixel flex items-center gap-2 text-lg">
          <AppLogo className="size-7" />
          {config.app.name}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{email}</span>
          <LogoutButton />
        </span>
      </header>

      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-8 md:grid-cols-[13rem_1fr] md:gap-12 md:px-8 md:py-14">
        <nav aria-label="Setup steps">
          <ol className="flex gap-4 md:flex-col md:gap-5">
            {STEPS.map((s, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <li
                  key={s.title}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "font-pixel flex items-center gap-3 text-sm",
                    !active && "text-muted-foreground"
                  )}
                >
                  {/* Pixel step markers: yellow for the current step, green once done. */}
                  <span
                    className={cn(
                      "border-outline bg-card flex size-8 shrink-0 items-center justify-center border-2 text-sm tabular-nums",
                      active && "bg-highlight text-highlight-foreground",
                      done && "bg-primary text-primary-foreground"
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-label="Done" /> : index + 1}
                  </span>
                  <span className={cn("hidden md:inline", active && "text-foreground")}>
                    {s.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <section aria-labelledby="onboarding-step-title" className="pixel-panel min-w-0 p-5 md:p-8">
          <h1 id="onboarding-step-title" tabIndex={-1} className="text-lg outline-none md:text-xl">
            {current.title}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-prose">{current.lead}</p>

          <form
            id="onboarding-form"
            className="mt-8"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (isLast) finish();
              else next();
            }}
          >
            {step === 0 && (
              <FieldGroup>
                <Field>
                  <FieldLabel id="preset-label">Region</FieldLabel>
                  <ChoiceCards
                    aria-labelledby="preset-label"
                    value={values.preset}
                    onValueChange={choosePreset}
                    choices={presets.map((p) => ({
                      value: p.key,
                      label: p.name,
                      description:
                        p.key === "ph"
                          ? "Semi-monthly cutoffs, ₱, SSS and PhilHealth"
                          : "Monthly pay, any currency",
                    }))}
                  />
                </Field>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Controller
                    name="currency"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="onboarding-currency">Currency</FieldLabel>
                        <Autocomplete
                          id="onboarding-currency"
                          options={currencies}
                          value={field.value}
                          onChange={(v) => v && field.onChange(v)}
                          onBlur={field.onBlur}
                          placeholder="Search currencies"
                          emptyMessage="No currencies match."
                          required
                          invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : (
                          <FieldDescription>
                            Every total in the app uses this currency.
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="timezone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="onboarding-timezone">Time zone</FieldLabel>
                        <Autocomplete
                          id="onboarding-timezone"
                          options={timeZones}
                          value={field.value}
                          onChange={(v) => v && field.onChange(v)}
                          onBlur={field.onBlur}
                          placeholder="Search time zones"
                          emptyMessage="No time zones match."
                          required
                          invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : (
                          <FieldDescription>
                            Decides which day a late-night expense lands on.
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            )}

            {step === 1 && (
              <FieldGroup>
                <Field>
                  <FieldLabel id="regular-pay-label">How does your income arrive?</FieldLabel>
                  <ChoiceCards
                    aria-labelledby="regular-pay-label"
                    value={values.regular_pay ? "regular" : "irregular"}
                    onValueChange={(v) => form.setValue("regular_pay", v === "regular")}
                    choices={[
                      {
                        value: "regular",
                        label: "On fixed paydays",
                        description: "Salary, allowance, pension",
                      },
                      {
                        value: "irregular",
                        label: "Whenever I'm paid",
                        description: "Freelance, commission, business",
                      },
                    ]}
                  />
                </Field>

                {values.regular_pay && (
                  <>
                    <Field>
                      <FieldLabel id="schedule-type-label">How often?</FieldLabel>
                      <ChoiceCards
                        aria-labelledby="schedule-type-label"
                        value={values.pay_schedule.type}
                        onValueChange={(type) => {
                          form.setValue("pay_schedule.type", type);
                          form.setValue(
                            "pay_schedule.pay_days",
                            type === "semi_monthly" ? [15, 31] : [31]
                          );
                        }}
                        choices={SCHEDULE_CHOICES}
                      />
                    </Field>

                    {(values.pay_schedule.type === "semi_monthly" ||
                      values.pay_schedule.type === "monthly") && (
                      <Controller
                        name="pay_schedule.pay_days"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>
                              {values.pay_schedule.type === "semi_monthly" ? "Paydays" : "Payday"}
                            </FieldLabel>
                            <div className="flex flex-wrap items-center gap-3">
                              {(values.pay_schedule.type === "semi_monthly" ? [0, 1] : [0]).map(
                                (slot) => (
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
                                          {day === 31
                                            ? "Last day"
                                            : dayLabel(day).replace("the ", "")}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )
                              )}
                            </div>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    )}

                    {(values.pay_schedule.type === "weekly" ||
                      values.pay_schedule.type === "biweekly") && (
                      <Controller
                        name="pay_schedule.anchor_date"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} className="max-w-60">
                            <FieldLabel htmlFor="onboarding-anchor">
                              Your most recent payday
                            </FieldLabel>
                            <Input
                              {...field}
                              id="onboarding-anchor"
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
                        value={values.pay_schedule.weekend_rule}
                        onValueChange={(rule) => form.setValue("pay_schedule.weekend_rule", rule)}
                        choices={WEEKEND_CHOICES}
                      />
                    </Field>
                  </>
                )}

                <p
                  aria-live="polite"
                  className="pixel-box bg-secondary text-secondary-foreground max-w-prose px-4 py-3 text-lg leading-relaxed font-medium text-balance"
                >
                  {describePaySchedule(values)}
                </p>
              </FieldGroup>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <dl className="pixel-box bg-card divide-y">
                  {[
                    ["Region", presetName],
                    ["Currency", currencyLabel(values.currency)],
                    ["Time zone", values.timezone],
                    ["Paydays", describePaySchedule(values)],
                  ].map(([term, detail]) => (
                    <div
                      key={term}
                      className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4"
                    >
                      <dt className="text-muted-foreground text-sm">{term}</dt>
                      <dd className="text-sm">{detail}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <h2 className="text-lg">Also ready when you finish</h2>
                  <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-5 text-sm">
                    <li>Starter spending, savings and investment categories for {presetName}</li>
                    <li>A default budget template you can fill in with your own amounts</li>
                    <li>Common payment methods and payroll deductions</li>
                    <li>A &ldquo;Cash on hand&rdquo; account starting at zero</li>
                  </ul>
                </div>
              </div>
            )}

            {rootError && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}

            <div className="border-border mt-10 flex items-center justify-between gap-3 border-t-2 border-dashed pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className={cn(step === 0 && "invisible")}
              >
                Back
              </Button>
              <Button type="submit" disabled={isPending} className="menu-cursor min-w-32 pl-6">
                {isLast ? (isPending ? "Setting up..." : "Finish setup") : "Continue"}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
