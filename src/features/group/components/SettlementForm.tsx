"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { poof, questComplete } from "@/components/pixel/poof";
import { Autocomplete } from "@/components/shared/autocomplete";
import { ChoiceCards } from "@/components/shared/choice-cards";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { todayIn } from "@/lib/utils/date";
import { applyApiErrors } from "@/lib/utils/form";
import { generateUuid } from "@/lib/utils/string";

import { useCorrectGroupSettlement, useGroupAccounts, useSettleGroup } from "../hooks";
import {
  GroupSettlementFormSchema,
  type GroupDetail,
  type GroupSettlement,
  type GroupSettlementFormValues,
  type Suggestion,
} from "../schema";
import { NetAmount } from "./group-bits";

const FIELDS = [
  "from_participant_id",
  "to_participant_id",
  "amount",
  "settlement_date",
  "reference_number",
  "notes",
  "record_as",
  "account_id",
] as const;

type SettlementFormProps = {
  group: GroupDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A settlement to correct. */
  settlement?: GroupSettlement | null;
  /** A suggested transfer to prefill (never recorded without this form being submitted). */
  suggestion?: Suggestion | null;
};

export function SettlementForm({
  group,
  open,
  onOpenChange,
  settlement,
  suggestion,
}: SettlementFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={settlement ? "Correct a settlement" : "Record a payment between people"}
    >
      {open && (
        <SettlementBody
          key={settlement?.id ?? JSON.stringify(suggestion ?? "new")}
          group={group}
          settlement={settlement ?? null}
          suggestion={suggestion ?? null}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function SettlementBody({
  group,
  settlement,
  suggestion,
  onDone,
}: {
  group: GroupDetail;
  settlement: GroupSettlement | null;
  suggestion: Suggestion | null;
  onDone: () => void;
}) {
  const { timezone } = useUserSettings();
  const settle = useSettleGroup();
  const correct = useCorrectGroupSettlement();
  const accounts = useGroupAccounts();
  const [idempotencyKey] = useState(generateUuid);
  const pending = settle.isPending || correct.isPending;

  const form = useForm<GroupSettlementFormValues>({
    resolver: zodResolver(GroupSettlementFormSchema),
    defaultValues: {
      from_participant_id: settlement?.from.id ?? suggestion?.from.id ?? "",
      to_participant_id: settlement?.to.id ?? suggestion?.to.id ?? "",
      amount: settlement?.amount.amount ?? suggestion?.amount.amount ?? "",
      settlement_date: settlement?.settlement_date ?? todayIn(timezone),
      reference_number: settlement?.reference_number ?? "",
      notes: settlement?.notes ?? "",
      record_as: "none",
      account_id: "",
    },
  });

  const [fromId, toId] = useWatch({
    control: form.control,
    name: ["from_participant_id", "to_participant_id"],
  });
  const recordAs = useWatch({ control: form.control, name: "record_as" });
  const me = group.participants.find((p) => p.is_me);
  const meInvolved = !!me && (fromId === me.id || toId === me.id);
  const options = group.participants.map((p) => ({
    value: p.id,
    label: p.is_me ? `${p.name} (me)` : p.name,
  }));
  const find = (id: string) => group.participants.find((p) => p.id === id);

  const onSubmit = (values: GroupSettlementFormValues) => {
    const payload = { ...values, record_as: meInvolved ? values.record_as : ("none" as const) };
    const onSuccess = (res: { message: string; data: GroupDetail }) => {
      toast.success(res.message);
      if (res.data.is_settled && !group.is_settled) questComplete(`${group.name}: all square`);
      else if (!settlement) poof("Paid!");
      onDone();
    };
    const onError = (error: Error) => applyApiErrors(error, form.setError, FIELDS);

    if (settlement) {
      correct.mutate(
        { id: group.id, settlementId: settlement.id, values: payload },
        { onSuccess, onError }
      );
    } else {
      settle.mutate({ id: group.id, values: payload, idempotencyKey }, { onSuccess, onError });
    }
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {settlement ? (
          <p className="pixel-box bg-muted px-3 py-2 text-sm">
            {settlement.from.name} paid {settlement.to.name}. To change who paid whom, void this one
            and record it again.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["from_participant_id", "to_participant_id"] as const).map((name) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => {
                  const person = find(field.value);
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`settle-${name}`}>
                        {name === "from_participant_id" ? "Who paid" : "Who received it"}
                      </FieldLabel>
                      <Autocomplete
                        id={`settle-${name}`}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={options}
                        placeholder="Choose a person"
                        emptyMessage="Nobody matches."
                        invalid={fieldState.invalid}
                        required
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : (
                        person && <NetAmount net={person.net} className="text-sm" />
                      )}
                    </Field>
                  );
                }}
              />
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settle-amount">Amount</FieldLabel>
                <CurrencyInput
                  id="settle-amount"
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
            name="settlement_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="settle-date">Paid on</FieldLabel>
                <Input {...field} id="settle-date" type="date" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {!settlement && meInvolved && (
          <>
            <Controller
              name="record_as"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel id="settle-record-label">In my accounts</FieldLabel>
                  <ChoiceCards
                    aria-labelledby="settle-record-label"
                    value={field.value}
                    onValueChange={field.onChange}
                    choices={[
                      {
                        value: "none",
                        label: "Don't record it",
                        description: "Cash you don't track, or already recorded.",
                      },
                      {
                        value: "balance",
                        label: fromId === me?.id ? "Out of my account" : "Into my account",
                        description:
                          "The account balance moves. Not income or spending: your share was already counted with the expense.",
                      },
                    ]}
                  />
                </Field>
              )}
            />
            {recordAs === "balance" && (
              <Controller
                name="account_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="settle-account">Account</FieldLabel>
                    <Autocomplete
                      id="settle-account"
                      value={field.value}
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

        {settlement?.account && (
          <p className="text-muted-foreground text-sm">
            Its movement in {settlement.account.name} is corrected too.
          </p>
        )}

        <Controller
          name="reference_number"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="settle-reference">Reference (optional)</FieldLabel>
              <Input {...field} id="settle-reference" maxLength={100} placeholder="GCash ref no." />
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="settle-notes">Notes (optional)</FieldLabel>
              <Textarea {...field} id="settle-notes" rows={2} maxLength={2000} />
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : settlement ? "Save correction" : "Record payment"}
        </Button>
      </FieldGroup>
    </form>
  );
}
