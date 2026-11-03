"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { poof } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { CurrencyInput } from "@/components/shared/currency-input";
import { useFormatMoney } from "@/components/shared/money-display";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { segmentClass } from "@/components/ui/segments";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { cn } from "@/lib/utils/component";
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

/** Up to this many saved people show as one-tap chips; more than that gets the searchable picker. */
const MAX_PERSON_CHIPS = 8;

/** A tappable chip (person, date shortcut): pressed gets the cursor-yellow highlight. */
const chipClass = cn(segmentClass, "pixel-box bg-card h-11 gap-1.5 px-3");

/** The calendar day before a YYYY-MM-DD date, parsed as local midnight so no time zone shifts it. */
const dayBefore = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
  const { timezone, currency } = useUserSettings();
  const formatMoney = useFormatMoney();
  const save = useSaveDebt();
  const people = usePeople();
  const accounts = useDebtAccounts();
  // Pick someone already saved, or type a new name (the API adds them).
  const [newPerson, setNewPerson] = useState(false);
  // Due date, reference and notes start folded away, unless this debt already has some.
  const [moreOpen, setMoreOpen] = useState(
    !!(debt?.due_date || debt?.reference_number || debt?.notes)
  );
  const today = todayIn(timezone);
  const yesterday = dayBefore(today);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(DebtFormSchema),
    defaultValues: {
      person_id: debt?.person.id ?? personId ?? "",
      person_name: "",
      direction: debt?.direction ?? "receivable",
      original_amount: debt?.original_amount.amount ?? "",
      debt_date: debt?.debt_date ?? today,
      due_date: debt?.due_date ?? "",
      description: debt?.description ?? "",
      notes: debt?.notes ?? "",
      reference_number: debt?.reference_number ?? "",
      record_in_account: false,
      account_id: "",
    },
  });

  const [
    direction,
    recordInAccount,
    personIdValue,
    personName,
    amount,
    debtDate,
    dueDate,
    reference,
    notes,
  ] = useWatch({
    control: form.control,
    name: [
      "direction",
      "record_in_account",
      "person_id",
      "person_name",
      "original_amount",
      "debt_date",
      "due_date",
      "reference_number",
      "notes",
    ],
  });
  const receivable = direction === "receivable";
  // With nobody saved yet, the name box is the only way in.
  const typingName = newPerson || (people.isSuccess && people.data.length === 0);
  const personList = people.data ?? [];
  const useChips = personList.length <= MAX_PERSON_CHIPS;

  // The debt in one sentence, so it's clear which way it goes before saving.
  const who =
    (typingName ? personName?.trim() : personList.find((p) => p.id === personIdValue)?.name) ||
    (receivable ? "Someone" : "someone");
  const howMuch = /[1-9]/.test(amount ?? "") ? formatMoney({ amount, currency }) : "…";
  const summary = receivable ? `${who} owes you ${howMuch}` : `You owe ${who} ${howMuch}`;

  const moreSummary =
    [dueDate && `Due ${dueDate}`, reference?.trim() && "Ref", notes?.trim() && "Note"]
      .filter(Boolean)
      .join(" · ") || "Due date, reference, notes";

  const foldedInvalid = () =>
    (["due_date", "reference_number", "notes"] as const).some(
      (name) => form.getFieldState(name).invalid
    );

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
        onError: (error) => {
          applyApiErrors(error, form.setError, FIELDS);
          if (foldedInvalid()) setMoreOpen(true);
        },
      }
    );
  };

  const rootError = form.formState.errors.root?.message;
  const personLabel = receivable ? "Who owes you?" : "Who do you owe?";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (errors) => {
        if (errors.due_date || errors.reference_number || errors.notes) setMoreOpen(true);
      })}
      noValidate
    >
      <FieldGroup>
        {/* 1. Which way the money goes. */}
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
                  className="grid-cols-2 [&_[role=radio]]:px-3"
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

        {/* 2. Who: one tap on someone saved, or a new name. */}
        {typingName ? (
          <Controller
            name="person_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || !!form.formState.errors.person_id}>
                <FieldLabel htmlFor="debt-person-name">{personLabel}</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="debt-person-name"
                  placeholder="e.g. Juan"
                  autoComplete="off"
                  autoFocus={newPerson}
                  aria-invalid={fieldState.invalid}
                  className="h-11"
                />
                <FieldError errors={[fieldState.error ?? form.formState.errors.person_id]} />
                {personList.length > 0 && (
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
                <FieldLabel id="debt-person-label" htmlFor={useChips ? undefined : "debt-person"}>
                  {personLabel}
                </FieldLabel>
                <div
                  role={useChips ? "group" : undefined}
                  aria-labelledby={useChips ? "debt-person-label" : undefined}
                  className="flex flex-wrap gap-2"
                >
                  {useChips ? (
                    personList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={field.value === p.id}
                        onClick={() => {
                          field.onChange(p.id);
                          form.clearErrors("person_id");
                        }}
                        className={chipClass}
                      >
                        {p.name}
                      </button>
                    ))
                  ) : (
                    <div className="min-w-0 flex-1 basis-56">
                      <Autocomplete
                        id="debt-person"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={personList.map((p) => ({ value: p.id, label: p.name }))}
                        loading={people.isLoading}
                        placeholder="Choose a person"
                        emptyMessage="Nobody matches. Add them as someone new."
                        invalid={fieldState.invalid}
                        required
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className={chipClass}
                    onClick={() => {
                      form.clearErrors("person_id");
                      form.setValue("person_id", "");
                      setNewPerson(true);
                    }}
                  >
                    <Plus aria-hidden className="size-4" />
                    Someone new
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

        {/* 3. How much and what for. */}
        <div className="pixel-panel space-y-3 p-3">
          <Controller
            name="original_amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className={cn(
                  "[&_[data-slot=input-group]]:h-14 [&_input]:font-stat [&_input]:text-3xl",
                  receivable ? "[&_input]:text-income" : "[&_input]:text-expense"
                )}
              >
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
                  className="h-11"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* 4. When: today by default, one tap for yesterday, or any date. */}
        <Controller
          name="debt_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="debt-date">Date</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: today, label: "Today" },
                  { value: yesterday, label: "Yesterday" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    aria-pressed={debtDate === chip.value}
                    onClick={() => form.setValue("debt_date", chip.value)}
                    className={cn(chipClass, "h-10")}
                  >
                    {chip.label}
                  </button>
                ))}
                <Input
                  {...field}
                  id="debt-date"
                  type="date"
                  aria-invalid={fieldState.invalid}
                  className="h-10 w-auto min-w-40 flex-1"
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* 5. Did money actually move? Only asked when adding. */}
        {!debt && (
          <div className="pixel-box bg-card space-y-3 p-3">
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
          </div>
        )}

        {/* 6. Optional extras, folded away with a summary of what's set. Kept mounted so their values always submit. */}
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger className="pixel-box bg-card hover:bg-accent focus-visible:outline-highlight group flex min-h-11 w-full items-center gap-2 px-3 text-left outline-none focus-visible:outline-3">
            <span className="font-pixel text-sm">More options</span>
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-right text-sm">
              {moreSummary}
            </span>
            <ChevronDown
              className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent forceMount className="grid gap-4 pt-3 data-[state=closed]:hidden">
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
          </CollapsibleContent>
        </Collapsible>

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>

      {/* Pinned to the bottom of the dialog or sheet: the debt in a sentence, and the button. */}
      <div className="bg-card border-outline sticky -bottom-[19px] z-10 -mx-[19px] mt-6 -mb-[19px] flex items-center gap-3 border-t-2 px-[19px] py-3 in-data-[slot=sheet-content]:-bottom-4 in-data-[slot=sheet-content]:-mx-4 in-data-[slot=sheet-content]:-mb-4 in-data-[slot=sheet-content]:px-4">
        <p className="min-w-0 flex-1 text-sm" aria-live="polite">
          {summary}
        </p>
        <Button type="submit" disabled={save.isPending} className="h-11 min-w-32">
          {save.isPending ? "Saving..." : debt ? "Save changes" : "Add debt"}
        </Button>
      </div>
    </form>
  );
}
