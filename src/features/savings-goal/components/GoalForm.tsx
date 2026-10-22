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
import { applyApiErrors } from "@/lib/utils/form";

import { useGoalAccounts, useSaveGoal } from "../hooks";
import { GoalFormSchema, type GoalFormValues, type SavingsGoal } from "../schema";

const FIELDS = [
  "name",
  "target_amount",
  "target_date",
  "account_id",
  "is_emergency_fund",
  "emergency_months",
] as const;

const defaults = (goal: SavingsGoal | null, emergency: boolean): GoalFormValues => ({
  name: goal?.name ?? (emergency ? "Emergency fund" : ""),
  // A computed emergency-fund target isn't something the user typed, so don't put it in the field.
  target_amount: goal && !goal.target_is_computed ? goal.target_amount.amount : "",
  target_date: goal?.target_date ?? "",
  account_id: goal?.account?.id ?? "",
  is_emergency_fund: goal?.is_emergency_fund ?? emergency,
  emergency_months: String(goal?.emergency_months ?? 6),
});

type GoalFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to add a new goal. */
  goal: SavingsGoal | null;
  /** Pre-ticks "This is my emergency fund" for a new goal. */
  emergency?: boolean;
  /** Hides the emergency-fund switch when another goal already is one. */
  canBeEmergencyFund: boolean;
};

export function GoalForm({
  open,
  onOpenChange,
  goal,
  emergency = false,
  canBeEmergencyFund,
}: GoalFormProps) {
  return (
    <FormShell open={open} onOpenChange={onOpenChange} title={goal ? "Edit goal" : "Add goal"}>
      {open && (
        <GoalFormBody
          key={goal?.id ?? `new-${emergency}`}
          goal={goal}
          emergency={emergency}
          canBeEmergencyFund={canBeEmergencyFund}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function GoalFormBody({
  goal,
  emergency,
  canBeEmergencyFund,
  onDone,
}: {
  goal: SavingsGoal | null;
  emergency: boolean;
  canBeEmergencyFund: boolean;
  onDone: () => void;
}) {
  const save = useSaveGoal();
  const accounts = useGoalAccounts();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(GoalFormSchema),
    defaultValues: defaults(goal, emergency),
  });
  const isEmergency = useWatch({ control: form.control, name: "is_emergency_fund" });

  const accountOptions = [
    // Keep a now-archived account visible when editing, so saving doesn't drop it.
    ...(goal?.account && !accounts.data?.some((a) => a.id === goal.account!.id)
      ? [{ value: goal.account.id, label: goal.account.name }]
      : []),
    ...(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name })),
  ];

  const onSubmit = (values: GoalFormValues) =>
    save.mutate(
      { id: goal?.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
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
              <FieldLabel htmlFor="goal-name">Name</FieldLabel>
              <Input
                {...field}
                id="goal-name"
                placeholder="New laptop, Japan trip, Tuition"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {(canBeEmergencyFund || goal?.is_emergency_fund) && (
          <Controller
            name="is_emergency_fund"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="goal-emergency"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <div className="space-y-1">
                  <FieldLabel htmlFor="goal-emergency" className="font-normal">
                    This is my emergency fund
                  </FieldLabel>
                  <FieldDescription>
                    Its target follows your essential spending, so it grows with your costs.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </div>
              </Field>
            )}
          />
        )}

        {isEmergency && (
          <Controller
            name="emergency_months"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="max-w-48">
                <FieldLabel htmlFor="goal-months">Months to cover</FieldLabel>
                <Input
                  {...field}
                  id="goal-months"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={24}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>Three to six months is a common aim.</FieldDescription>
                )}
              </Field>
            )}
          />
        )}

        <Controller
          name="target_amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="goal-target">
                {isEmergency ? "Target until there's enough history (optional)" : "Target amount"}
              </FieldLabel>
              <CurrencyInput
                id="goal-target"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                isEmergency && (
                  <FieldDescription>
                    Once you have three months of spending in essential categories, the target is
                    worked out for you.
                  </FieldDescription>
                )
              )}
            </Field>
          )}
        />

        <Controller
          name="target_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="max-w-60">
              <FieldLabel htmlFor="goal-date">Reach it by (optional)</FieldLabel>
              <Input {...field} id="goal-date" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="account_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="goal-account">Where the money is kept (optional)</FieldLabel>
              <Autocomplete
                id="goal-account"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={accountOptions}
                loading={accounts.isLoading}
                placeholder="No specific account"
                emptyMessage="No accounts match."
                invalid={fieldState.invalid}
                clearable
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Linking an account lets you move money into it when you add to this goal.
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

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : goal ? "Save changes" : "Add goal"}
        </Button>
      </FieldGroup>
    </form>
  );
}
