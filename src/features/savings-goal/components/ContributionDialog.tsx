"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof, questComplete } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { useFormatMoney } from "@/components/shared/money-display";
import { applyApiErrors } from "@/lib/utils/form";

import { useContribute, useGoalAccounts, useSavingCategories } from "../hooks";
import {
  ContributionFormSchema,
  type ContributionFormValues,
  type ContributionType,
  type SavingsGoal,
} from "../schema";

const FIELDS = ["type", "amount", "date", "notes", "from_account_id", "category_id"] as const;

/** Today's date in the user's own time zone, as YYYY-MM-DD. */
const todayIn = (timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());

type ContributionDialogProps = {
  /** The goal to add to or take from; null closes the dialog. */
  goal: SavingsGoal | null;
  type: ContributionType;
  onOpenChange: (open: boolean) => void;
};

export function ContributionDialog({ goal, type, onOpenChange }: ContributionDialogProps) {
  return (
    <FormShell
      open={!!goal}
      onOpenChange={onOpenChange}
      title={
        goal ? `${type === "withdrawal" ? "Take money out of" : "Add money to"} ${goal.name}` : ""
      }
    >
      {goal && (
        <ContributionBody
          key={`${goal.id}-${type}`}
          goal={goal}
          type={type}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function ContributionBody({
  goal,
  type,
  onDone,
}: {
  goal: SavingsGoal;
  type: ContributionType;
  onDone: () => void;
}) {
  const { timezone, currency } = useUserSettings();
  const format = useFormatMoney();
  const contribute = useContribute();
  const accounts = useGoalAccounts();
  const categories = useSavingCategories();

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(ContributionFormSchema),
    defaultValues: {
      type,
      amount: "",
      date: todayIn(timezone),
      notes: "",
      move_money: false,
      from_account_id: "",
      category_id: "",
    },
  });

  const [currentType, moveMoney] = useWatch({
    control: form.control,
    name: ["type", "move_money"],
  });
  const withdrawing = currentType === "withdrawal";
  const otherAccounts = accounts.data?.filter((a) => a.id !== goal.account?.id) ?? [];

  const onSubmit = (values: ContributionFormValues) => {
    if (values.move_money && !values.from_account_id) {
      form.setError("from_account_id", {
        message: withdrawing
          ? "Choose where the money goes."
          : "Choose where the money comes from.",
      });
      return;
    }

    contribute.mutate(
      { id: goal.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          // A contribution that takes the goal to 100% completes the quest; anything else just poofs.
          if (res.data.progress_percent === 100 && goal.progress_percent !== 100) {
            questComplete(goal.name);
          } else {
            const amount = format({ amount: values.amount || "0", currency });
            poof(withdrawing ? `-${amount}` : `+${amount}`);
          }
          onDone();
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      }
    );
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel id="contribution-type-label">What are you doing?</FieldLabel>
              <ChoiceCards
                aria-labelledby="contribution-type-label"
                value={field.value}
                onValueChange={field.onChange}
                choices={[
                  { value: "contribution", label: "Add money" },
                  { value: "withdrawal", label: "Take money out" },
                ]}
              />
            </Field>
          )}
        />

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contribution-amount">Amount</FieldLabel>
              <CurrencyInput
                id="contribution-amount"
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

        <Controller
          name="date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="max-w-60">
              <FieldLabel htmlFor="contribution-date">Date</FieldLabel>
              <Input
                {...field}
                id="contribution-date"
                type="date"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {goal.account ? (
          <>
            <Controller
              name="move_money"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="contribution-move"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  <div className="space-y-1">
                    <FieldLabel htmlFor="contribution-move" className="font-normal">
                      Also move the money now
                    </FieldLabel>
                    <FieldDescription>
                      {moveMoney
                        ? withdrawing
                          ? `Records a transfer out of ${goal.account!.name}.`
                          : `Records a transfer into ${goal.account!.name}.`
                        : `Leave this off if the money is already in ${goal.account!.name}; the goal just sets it aside.`}
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />

            {moveMoney && (
              <>
                <Controller
                  name="from_account_id"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="contribution-from">
                        {withdrawing ? "Move it to" : "Move it from"}
                      </FieldLabel>
                      <Autocomplete
                        id="contribution-from"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={otherAccounts.map((a) => ({ value: a.id, label: a.name }))}
                        loading={accounts.isLoading}
                        placeholder="Choose an account"
                        emptyMessage="No accounts match."
                        invalid={fieldState.invalid}
                        required
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {!withdrawing && (
                  <Controller
                    name="category_id"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="contribution-category">
                          Savings category (optional)
                        </FieldLabel>
                        <Autocomplete
                          id="contribution-category"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          options={(categories.data ?? []).map((c) => ({
                            value: c.id,
                            label: c.name,
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
                          <FieldDescription>
                            Tag it so this cutoff&apos;s budget counts it as saving.
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            This goal isn&apos;t linked to an account, so this only sets money aside on paper. Link
            an account in the goal&apos;s settings to move money as well.
          </p>
        )}

        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contribution-notes">Notes (optional)</FieldLabel>
              <Textarea
                {...field}
                id="contribution-notes"
                rows={2}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={contribute.isPending}>
          {contribute.isPending ? "Saving..." : withdrawing ? "Take money out" : "Add money"}
        </Button>
      </FieldGroup>
    </form>
  );
}
