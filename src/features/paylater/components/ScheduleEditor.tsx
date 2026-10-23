"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";

import { CurrencyInput } from "@/components/shared/currency-input";
import { MoneyDisplay } from "@/components/shared/money-display";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isZero, type Money } from "@/lib/money";

import type { ScheduleRow } from "../schema";

type ScheduleForm = { installments: ScheduleRow[]; total_repayment: string };

/**
 * The installments as the provider bills them: a due date and an amount per row. Rows can be edited,
 * added or removed; the API checks they add up to the total to repay. Paid amounts come from the API.
 */
export function ScheduleEditor({ paidById = {} }: { paidById?: Record<string, Money> }) {
  const form = useFormContext<ScheduleForm>();
  // keyName "key": each row's own `id` is the installment's id, which the API needs back.
  const { fields, append, remove } = useFieldArray<ScheduleForm, "installments", "key">({
    control: form.control,
    name: "installments",
    keyName: "key",
  });
  const listError = form.formState.errors.installments;

  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {fields.map((row, index) => {
          const paid = row.id ? paidById[row.id] : undefined;
          const locked = !!paid && !isZero(paid);

          return (
            <li
              key={row.key}
              className="border-outline/40 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-start gap-2 border-b-2 border-dashed pb-2"
            >
              <span className="font-pixel text-muted-foreground pt-2.5 text-sm">#{index + 1}</span>
              <Controller
                name={`installments.${index}.due_date`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      {...field}
                      type="date"
                      aria-label={`Installment ${index + 1} due date`}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </div>
                )}
              />
              <Controller
                name={`installments.${index}.amount`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <div>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      aria-label={`Installment ${index + 1} amount`}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      locked && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          <MoneyDisplay value={paid} tone="neutral" /> paid
                        </p>
                      )
                    )}
                  </div>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                disabled={fields.length === 1 || locked}
                aria-label={
                  locked
                    ? `Installment ${index + 1} has payments`
                    : `Remove installment ${index + 1}`
                }
                onClick={() => remove(index)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ol>
      {listError?.message && <FieldError errors={[listError]} />}
      {listError?.root?.message && <FieldError errors={[listError.root]} />}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ due_date: "", amount: "" })}
      >
        <Plus className="size-4" aria-hidden />
        Add installment
      </Button>
    </div>
  );
}
