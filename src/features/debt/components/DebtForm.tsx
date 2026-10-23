"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof } from "@/components/pixel/poof";
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
import { routes } from "@/config/routes";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { applyApiErrors } from "@/lib/utils/form";

import { useDebtAccounts, usePeople, useSaveDebt } from "../hooks";
import { DebtFormSchema, type DebtDetail, type DebtFormValues } from "../schema";
import { todayIn } from "@/lib/utils/date";

const FIELDS = [
  "person_id",
  "person_name",
  "direction",
  "original_amount",
  "debt_date",
  "due_date",
  "description",
  "notes",
  "reference_number",
  "account_id",
] as const;

type DebtFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The debt to edit; null adds a new one. */
  debt: DebtDetail | null;
  /** Pre-picks the person, e.g. from their own page. */
  personId?: string;
};

export function DebtForm({ open, onOpenChange, debt, personId }: DebtFormProps) {
  return (
    <FormShell open={open} onOpenChange={onOpenChange} title={debt ? "Edit debt" : "Add a debt"}>
      {open && (
        <DebtFormBody
          key={debt?.id ?? "new"}
          debt={debt}
          personId={personId}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function DebtFormBody({
  debt,
  personId,
  onDone,
}: {
  debt: DebtDetail | null;
  personId?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const { timezone } = useUserSettings();
  const save = useSaveDebt();
  const people = usePeople();
  const accounts = useDebtAccounts();
  // Pick someone already saved, or type a new name (the API adds them).
  const [newPerson, setNewPerson] = useState(false);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(DebtFormSchema),
    defaultValues: {
      person_id: debt?.person.id ?? personId ?? "",
      person_name: "",
      direction: debt?.direction ?? "receivable",
      original_amount: debt?.original_amount.amount ?? "",
      debt_date: debt?.debt_date ?? todayIn(timezone),
      due_date: debt?.due_date ?? "",
      description: debt?.description ?? "",
      notes: debt?.notes ?? "",
      reference_number: debt?.reference_number ?? "",
      record_in_account: false,
      account_id: "",
    },
  });

  const [direction, recordInAccount] = useWatch({
    control: form.control,
    name: ["direction", "record_in_account"],
  });
  const receivable = direction === "receivable";
  // With nobody saved yet, the name box is the only way in.
  const typingName = newPerson || (people.isSuccess && people.data.length === 0);

  const onSubmit = (values: DebtFormValues) => {
    const payload = typingName ? { ...values, person_id: "" } : { ...values, person_name: "" };

    save.mutate(
      { id: debt?.id, values: payload },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
          if (!debt) {
            poof(receivable ? "IOU!" : "Noted!");
            router.push(routes.debts.detail(res.data.id));
          }
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      }
    );
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {debt ? (
          <p className="text-muted-foreground text-sm">
            {receivable ? "Money owed to you." : "Money you owe."} The direction can&apos;t change
            once a debt is saved.
          </p>
        ) : (
          <Controller
            name="direction"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel id="debt-direction-label">Which way does the money go?</FieldLabel>
                <ChoiceCards
                  aria-labelledby="debt-direction-label"
                  value={field.value}
                  onValueChange={field.onChange}
                  choices={[
                    {
                      value: "receivable",
                      label: "Money owed to me",
                      description: "You lent money or paid for someone.",
                    },
                    {
                      value: "payable",
                      label: "Money I owe",
                      description: "You borrowed, or someone paid for you.",
                    },
                  ]}
                />
              </Field>
            )}
          />
        )}

        {typingName ? (
          <Controller
            name="person_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || !!form.formState.errors.person_id}>
                <FieldLabel htmlFor="debt-person-name">
                  {receivable ? "Who owes you?" : "Who do you owe?"}
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="debt-person-name"
                  placeholder="e.g. Juan"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error ?? form.formState.errors.person_id]} />
                {people.data && people.data.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto justify-start px-0"
                    onClick={() => {
                      form.setValue("person_name", "");
                      setNewPerson(false);
                    }}
                  >
                    Pick someone you&apos;ve added before
                  </Button>
                )}
              </Field>
            )}
          />
        ) : (
          <Controller
            name="person_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="debt-person">
                  {receivable ? "Who owes you?" : "Who do you owe?"}
                </FieldLabel>
                <Autocomplete
                  id="debt-person"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={(people.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
                  loading={people.isLoading}
                  placeholder="Choose a person"
                  emptyMessage="Nobody matches. Add them as someone new."
                  invalid={fieldState.invalid}
                  required
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto justify-start px-0"
                  onClick={() => {
                    form.clearErrors("person_id");
                    form.setValue("person_id", "");
                    setNewPerson(true);
                  }}
                >
                  + Someone new
                </Button>
              </Field>
            )}
          />
        )}

        <Controller
          name="original_amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="debt-amount">Amount</FieldLabel>
              <CurrencyInput
                id="debt-amount"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                debt &&
                debt.settlements_count > 0 && (
                  <FieldDescription>
                    It can&apos;t go below what&apos;s already settled.
                  </FieldDescription>
                )
              )}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="debt-description">What&apos;s it for?</FieldLabel>
              <Input
                {...field}
                id="debt-description"
                placeholder={
                  receivable ? "e.g. Lent for tuition" : "e.g. Concert ticket she paid for"
                }
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="debt_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="debt-date">Date</FieldLabel>
                <Input {...field} id="debt-date" type="date" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="due_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="debt-due">Due date (optional)</FieldLabel>
                <Input {...field} id="debt-due" type="date" aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>e.g. your next payday.</FieldDescription>
                )}
              </Field>
            )}
          />
        </div>

        {!debt && (
          <>
            <Controller
              name="record_in_account"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="debt-record"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  <div className="space-y-1">
                    <FieldLabel htmlFor="debt-record" className="font-normal">
                      {receivable
                        ? "The money left one of my accounts"
                        : "The money came into one of my accounts"}
                    </FieldLabel>
                    <FieldDescription>
                      {recordInAccount
                        ? `Moves that account's balance ${receivable ? "down" : "up"}. It isn't counted as spending or income.`
                        : receivable
                          ? "Leave this off if you've already recorded it, or no money moved."
                          : "Leave this off when someone paid for something for you; record that as an expense instead."}
                    </FieldDescription>
                  </div>
                </Field>
              )}
            />

            {recordInAccount && (
              <Controller
                name="account_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="debt-account">
                      {receivable ? "Taken from" : "Put into"}
                    </FieldLabel>
                    <Autocomplete
                      id="debt-account"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
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
            )}
          </>
        )}

        <Controller
          name="reference_number"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="debt-reference">Reference number (optional)</FieldLabel>
              <Input
                {...field}
                id="debt-reference"
                placeholder="e.g. GCash ref no."
                aria-invalid={fieldState.invalid}
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
              <FieldLabel htmlFor="debt-notes">Notes (optional)</FieldLabel>
              <Textarea {...field} id="debt-notes" rows={2} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : debt ? "Save changes" : "Add debt"}
        </Button>
      </FieldGroup>
    </form>
  );
}
