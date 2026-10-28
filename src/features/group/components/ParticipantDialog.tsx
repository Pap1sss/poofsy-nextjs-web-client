"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Autocomplete } from "@/components/shared/autocomplete";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { applyApiErrors } from "@/lib/utils/form";

import { useAddParticipant, useSavedPeople, useUpdateParticipant } from "../hooks";
import { ParticipantFormSchema, type Participant, type ParticipantFormValues } from "../schema";

type ParticipantDialogProps = {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The participant to rename; null adds one. */
  participant: Participant | null;
};

export function ParticipantDialog({
  groupId,
  open,
  onOpenChange,
  participant,
}: ParticipantDialogProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={participant ? `Edit ${participant.name}` : "Add someone"}
    >
      {open && (
        <ParticipantBody
          key={participant?.id ?? "new"}
          groupId={groupId}
          participant={participant}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function ParticipantBody({
  groupId,
  participant,
  onDone,
}: {
  groupId: string;
  participant: Participant | null;
  onDone: () => void;
}) {
  const add = useAddParticipant();
  const update = useUpdateParticipant();
  const people = useSavedPeople();
  const pending = add.isPending || update.isPending;

  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(ParticipantFormSchema),
    defaultValues: { name: participant?.name ?? "", person_id: participant?.person_id ?? "" },
  });

  const onSubmit = (values: ParticipantFormValues) => {
    const options = {
      onSuccess: (res: { message: string }) => {
        toast.success(res.message);
        onDone();
      },
      onError: (error: Error) =>
        applyApiErrors(error, form.setError, ["name", "person_id"] as const),
    };

    if (participant) update.mutate({ id: groupId, participantId: participant.id, values }, options);
    else add.mutate({ id: groupId, values }, options);
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {(people.data?.length ?? 0) > 0 && (
          <Controller
            name="person_id"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="participant-person">
                  From your people list (optional)
                </FieldLabel>
                <Autocomplete
                  id="participant-person"
                  value={field.value}
                  onChange={(id) => {
                    field.onChange(id);
                    const person = people.data?.find((p) => p.id === id);
                    if (person) form.setValue("name", person.name, { shouldValidate: true });
                  }}
                  options={(people.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
                  placeholder="Search people you've added on Debts"
                  emptyMessage="Nobody matches."
                  clearable
                />
              </Field>
            )}
          />
        )}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="participant-name">Name or nickname</FieldLabel>
              <Input
                {...field}
                id="participant-name"
                maxLength={100}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>They don&apos;t need a Poofsy account.</FieldDescription>
              )}
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : participant ? "Save" : "Add"}
        </Button>
      </FieldGroup>
    </form>
  );
}
