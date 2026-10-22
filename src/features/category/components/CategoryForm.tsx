"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ChoiceCards } from "@/components/shared/choice-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Input } from "@/components/ui/input";
import { applyApiErrors } from "@/lib/utils/form";

import { useSaveCategory } from "../hooks";
import {
  CATEGORY_KINDS,
  CATEGORY_KIND_LABELS,
  CategoryFormSchema,
  type Category,
  type CategoryFormValues,
} from "../schema";

const FIELDS = ["name", "kind", "color", "icon", "is_essential"] as const;

const KIND_HINTS = {
  spending: "Money that leaves, like food or bills",
  savings: "Transfers you set aside",
  investment: "Transfers into investments",
} as const;

type CategoryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
};

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit category" : "Add category"}
    >
      {open && (
        <CategoryFormBody
          key={category?.id ?? "new"}
          category={category}
          onDone={() => onOpenChange(false)}
        />
      )}
    </FormShell>
  );
}

function CategoryFormBody({ category, onDone }: { category: Category | null; onDone: () => void }) {
  const save = useSaveCategory();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      kind: category?.kind ?? "spending",
      color: category?.color ?? "#0f766e",
      icon: category?.icon ?? "",
      is_essential: category?.is_essential ?? false,
    },
  });

  const onSubmit = (values: CategoryFormValues) =>
    save.mutate(
      { id: category?.id, values, version: category?.updated_at },
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
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                {...field}
                id="category-name"
                placeholder="Groceries"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="kind"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel id="category-kind-label">Kind</FieldLabel>
              <ChoiceCards
                aria-labelledby="category-kind-label"
                className="sm:grid-cols-3"
                value={field.value}
                onValueChange={field.onChange}
                choices={CATEGORY_KINDS.map((kind) => ({
                  value: kind,
                  label: CATEGORY_KIND_LABELS[kind],
                  description: KIND_HINTS[kind],
                }))}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <Controller
            name="color"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="category-color">Colour</FieldLabel>
                <input
                  {...field}
                  id="category-color"
                  type="color"
                  className="border-outline h-11 w-20 cursor-pointer border-2 bg-card p-1"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="icon"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="category-icon">Icon</FieldLabel>
                <Input
                  {...field}
                  id="category-icon"
                  placeholder="shopping-bag"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>Optional. Any Lucide icon name.</FieldDescription>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="is_essential"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="category-essential"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
              <FieldContent>
                <FieldLabel htmlFor="category-essential">Essential</FieldLabel>
                <FieldDescription>Counts toward your emergency fund target.</FieldDescription>
              </FieldContent>
            </Field>
          )}
        />

        {rootError && (
          <Alert variant="destructive">
            <AlertDescription>{rootError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : category ? "Save changes" : "Add category"}
        </Button>
      </FieldGroup>
    </form>
  );
}
