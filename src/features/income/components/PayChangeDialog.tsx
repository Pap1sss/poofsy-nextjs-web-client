"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Sprite } from "@/components/pixel/sprites";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { applyApiErrors } from "@/lib/utils/form";

import { useChangePayAmount } from "../hooks";
import { PayChangeFormSchema, type IncomeSource, type PayChangeFormValues } from "../schema";

type PayChangeDialogProps = {
  source: IncomeSource | null;
  onOpenChange: (open: boolean) => void;
};

/** A raise or pay cut: the API end-dates this version and starts a new one from the chosen date. */
export function PayChangeDialog({ source, onOpenChange }: PayChangeDialogProps) {
  return (
    <FormShell
      open={!!source}
      onOpenChange={onOpenChange}
      title={source ? `Change pay for ${source.name}` : "Change pay"}
      size="md"
    >
      {source && (
        <PayChangeForm key={source.id} source={source} onDone={() => onOpenChange(false)} />
      )}
    </FormShell>
  );
}

function PayChangeForm({ source, onDone }: { source: IncomeSource; onDone: () => void }) {
  const { mutate: change, isPending } = useChangePayAmount();

  const form = useForm<PayChangeFormValues>({
    resolver: zodResolver(PayChangeFormSchema),
    defaultValues: {
      expected_gross: source.expected_gross.amount,
      expected_net: source.expected_net.amount,
      effective_from: "",
    },
  });

  const onSubmit = (values: PayChangeFormValues) =>
    change(
      { id: source.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) =>
          applyApiErrors(error, form.setError, [
            "expected_gross",
            "expected_net",
            "effective_from",
          ]),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Poof explains it, dialogue-box style. */}
      <div className="flex items-start gap-3">
        <Sprite name="mascot" size={32} className="mt-1" />
        <p className="pixel-box bg-card px-3 py-2 text-sm">
          Past income and budgets keep the old amount. Budgets you create for cutoffs from the start
          date expect the new one.
        </p>
      </div>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="expected_gross"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="change-gross">New gross</FieldLabel>
                <CurrencyInput
                  id="change-gross"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel htmlFor="change-net">New take-home</FieldLabel>
                <CurrencyInput
                  id="change-net"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
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
              <FieldLabel htmlFor="change-from">New pay starts on</FieldLabel>
              <Input {...field} id="change-from" type="date" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
          {isPending ? "Saving..." : "Save new pay"}
        </Button>
      </div>
    </form>
  );
}
