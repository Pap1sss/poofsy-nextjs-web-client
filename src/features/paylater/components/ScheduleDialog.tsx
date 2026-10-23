"use client";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/shared/currency-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { applyApiErrors } from "@/lib/utils/form";

import { useUpdateSchedule } from "../hooks";
import { ScheduleFormSchema, type PurchaseDetail, type ScheduleFormValues } from "../schema";
import { ScheduleEditor } from "./ScheduleEditor";

type ScheduleDialogProps = {
  /** The purchase whose schedule to edit; null closes the dialog. */
  purchase: PurchaseDetail | null;
  onOpenChange: (open: boolean) => void;
};

/** Edits the schedule to match the provider's statement. The change and the old schedule go in the history. */
export function ScheduleDialog({ purchase, onOpenChange }: ScheduleDialogProps) {
  return (
    <FormShell open={!!purchase} onOpenChange={onOpenChange} title="Edit the schedule">
      {purchase && <ScheduleBody purchase={purchase} onDone={() => onOpenChange(false)} />}
    </FormShell>
  );
}

function ScheduleBody({ purchase, onDone }: { purchase: PurchaseDetail; onDone: () => void }) {
  const update = useUpdateSchedule();
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(ScheduleFormSchema),
    defaultValues: {
      total_repayment: purchase.total_repayment.amount,
      installments: purchase.installments.map((i) => ({
        id: i.id,
        due_date: i.due_date,
        amount: i.amount.amount,
      })),
    },
  });

  const onSubmit = (values: ScheduleFormValues) =>
    update.mutate(
      { id: purchase.id, values },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onDone();
        },
        onError: (error) =>
          applyApiErrors(error, form.setError, [
            "total_repayment",
            "installments",
            ...purchase.installments.map((_, i) => `installments.${i}.amount` as const),
          ]),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <p className="text-muted-foreground text-sm">
            Match your provider&apos;s statement. Payments already made stay where they are: an
            installment can&apos;t go below what&apos;s paid on it.
          </p>
          <Controller
            name="total_repayment"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="schedule-total">Total to repay</FieldLabel>
                <CurrencyInput
                  id="schedule-total"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>The installments must add up to it.</FieldDescription>
                )}
              </Field>
            )}
          />
          <ScheduleEditor
            paidById={Object.fromEntries(purchase.installments.map((i) => [i.id, i.paid]))}
          />
          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save schedule"}
          </Button>
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
