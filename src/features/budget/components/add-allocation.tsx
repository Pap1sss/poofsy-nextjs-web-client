"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiValidationError } from "@/lib/utils/request";

import { KIND_LABEL } from "../constant";
import { useAddAllocation, useCategoryOptions } from "../hooks";

/** Adds a category the template didn't cover, e.g. after seeing unbudgeted spending. */
export function AddAllocation({
  budgetId,
  allocatedCategoryIds,
}: {
  budgetId: string;
  allocatedCategoryIds: string[];
}) {
  const categories = useCategoryOptions();
  const add = useAddAllocation(budgetId);
  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const available = (categories.data ?? []).filter((c) => !allocatedCategoryIds.includes(c.id));
  const allAllocated = categories.isSuccess && available.length === 0;

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={available.length === 0}
          aria-describedby={allAllocated ? "add-category-unavailable" : undefined}
        >
          <Plus className="size-4" aria-hidden />
          Add category
        </Button>
        {allAllocated && (
          <p id="add-category-unavailable" className="text-muted-foreground text-sm">
            Every active category is already in this budget.
          </p>
        )}
      </div>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      setErrors({ category_id: "Choose a category." });
      return;
    }

    add.mutate(
      { category_id: categoryId, amount: amount || "0" },
      {
        onSuccess: () => {
          setOpen(false);
          setCategoryId("");
          setAmount("");
          setErrors({});
        },
        onError: (error) => {
          if (error instanceof ApiValidationError) {
            setErrors(Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v[0]])));
          } else {
            toast.error(error.message);
          }
        },
      }
    );
  };

  return (
    <form
      onSubmit={submit}
      className="pixel-box bg-card grid gap-3 p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end"
    >
      <Field data-invalid={!!errors.category_id}>
        <FieldLabel htmlFor="add-allocation-category">Category</FieldLabel>
        <Autocomplete
          id="add-allocation-category"
          value={categoryId}
          onChange={setCategoryId}
          options={available.map((c) => ({
            value: c.id,
            label: c.name,
            color: c.color,
            hint: KIND_LABEL[c.kind],
          }))}
          loading={categories.isLoading}
          placeholder="Choose a category"
          emptyMessage="No categories match."
          invalid={!!errors.category_id}
          required
        />
        {errors.category_id && <FieldError>{errors.category_id}</FieldError>}
      </Field>
      <Field data-invalid={!!errors.amount}>
        <FieldLabel htmlFor="add-allocation-amount">Amount</FieldLabel>
        <CurrencyInput id="add-allocation-amount" value={amount} onChange={setAmount} />
        {errors.amount && <FieldError>{errors.amount}</FieldError>}
      </Field>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? "Adding..." : "Add"}
        </Button>
      </div>
    </form>
  );
}
