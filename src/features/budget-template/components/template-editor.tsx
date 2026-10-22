"use client";

import * as React from "react";
import Link from "next/link";
import { Controller, useFieldArray, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { Sprite } from "@/components/pixel/sprites";
import { Autocomplete } from "@/components/shared/autocomplete";
import { CurrencyInput } from "@/components/shared/currency-input";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useAccountOptions, useCategoryOptions } from "@/features/budget/hooks";
import type { CategoryOption } from "@/features/budget/schema";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";
import { applyApiErrors } from "@/lib/utils/form";

import { useTemplate, useUpdateTemplate } from "../hooks";
import {
  ITEM_FIELDS,
  TemplateFormSchema,
  toTemplateFormValues,
  toTemplatePayload,
  type BudgetTemplate,
  type TemplateFormValues,
} from "../schema";

const RULE_LABEL = {
  fixed: "Fixed amount",
  monthly_split: "Monthly amount, split across cutoffs",
  percentage: "Percentage of income",
  custom: "Enter it each cutoff",
} as const;

const SCOPE_LABEL = {
  every: "Every cutoff",
  first: "1st cutoff only",
  second: "2nd cutoff only",
} as const;

const newRule = (): TemplateFormValues["items"][number] => ({
  category_id: "",
  rule_type: "fixed",
  amount: "",
  percentage: "",
  cutoff_scope: "every",
  rollover: false,
  destination_account_id: "",
});

export function TemplateEditor({ templateId }: { templateId: string }) {
  const template = useTemplate(templateId);
  useSetBreadcrumbTitle(template.data?.name);

  if (template.error) return <Error message={template.error.message} />;
  if (!template.data) return <Skeleton className="h-96" />;

  return <Editor template={template.data} />;
}

function Editor({ template }: { template: BudgetTemplate }) {
  const categories = useCategoryOptions();
  const accounts = useAccountOptions();
  const update = useUpdateTemplate();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(TemplateFormSchema),
    defaultValues: toTemplateFormValues(template),
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });

  // Archived categories still in an older rule don't come back from GET /categories; keep them selectable.
  const categoryOptions = React.useMemo(() => {
    const options = [...(categories.data ?? [])];
    for (const item of template.items ?? []) {
      if (item.category && !options.some((c) => c.id === item.category!.id)) {
        options.push(item.category as CategoryOption);
      }
    }
    return options;
  }, [categories.data, template.items]);

  // Built once and shared by every rule row.
  const categoryChoices = React.useMemo(
    () => categoryOptions.map((c) => ({ value: c.id, label: c.name, color: c.color })),
    [categoryOptions]
  );
  const accountChoices = React.useMemo(
    () => (accounts.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [accounts.data]
  );

  const kindOf = (categoryId: string) => categoryOptions.find((c) => c.id === categoryId)?.kind;

  const onSubmit = (values: TemplateFormValues) =>
    update.mutate(
      { id: template.id, data: toTemplatePayload(values) },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          form.reset(toTemplateFormValues(res.data));
        },
        onError: (error) =>
          applyApiErrors(error, form.setError, [
            "name",
            ...values.items.flatMap((_, i) => ITEM_FIELDS.map((f) => `items.${i}.${f}`)),
          ] as Path<TemplateFormValues>[]),
      }
    );

  const rootError = form.formState.errors.root?.message;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
      <PageHeader
        title={template.name}
        sprite="scroll"
        description="Changes apply to new budgets. Existing budgets keep their amounts."
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link href={routes.budget_templates.home}>
                <ArrowLeft className="size-4" aria-hidden />
                All templates
              </Link>
            </Button>
            <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
              {update.isPending ? "Saving..." : "Save template"}
            </Button>
          </>
        }
      />

      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="max-w-sm">
            <FieldLabel htmlFor="template-name">Name</FieldLabel>
            <Input {...field} id="template-name" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <section aria-labelledby="template-rules" className="space-y-3">
        <h2 id="template-rules" className="flex items-center gap-2 text-xl">
          <Sprite name="flag" size={18} />
          Rules
        </h2>
        {fields.length === 0 && (
          <p className="pixel-box bg-card text-muted-foreground px-4 py-3 text-sm">
            No rules yet. Add one for each category a payday has to cover.
          </p>
        )}

        <ol className="space-y-3">
          {fields.map((row, index) => {
            const item = items?.[index] ?? row;
            const kind = kindOf(item.category_id);
            const err = form.formState.errors.items?.[index];

            return (
              <li
                key={row.id}
                className="pixel-box bg-card grid gap-4 p-4 lg:grid-cols-[1.3fr_1.4fr_1fr_1fr_auto] lg:items-start"
              >
                <Controller
                  name={`items.${index}.category_id`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`rule-${index}-category`}>Category</FieldLabel>
                      <Autocomplete
                        id={`rule-${index}-category`}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={categoryChoices}
                        loading={categories.isLoading}
                        placeholder="Choose a category"
                        emptyMessage="No categories match."
                        invalid={fieldState.invalid}
                        required
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name={`items.${index}.rule_type`}
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={`rule-${index}-type`}>Rule</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id={`rule-${index}-type`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(RULE_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                {item.rule_type === "percentage" ? (
                  <Controller
                    name={`items.${index}.percentage`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`rule-${index}-pct`}>Percentage</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id={`rule-${index}-pct`}
                            inputMode="decimal"
                            aria-invalid={fieldState.invalid}
                            onChange={(e) =>
                              field.onChange(e.target.value.replace(/[^0-9.]/g, "").slice(0, 8))
                            }
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>%</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                ) : (
                  <Controller
                    name={`items.${index}.amount`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`rule-${index}-amount`}>
                          {item.rule_type === "monthly_split" ? "Amount a month" : "Amount"}
                        </FieldLabel>
                        <CurrencyInput
                          id={`rule-${index}-amount`}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid}
                          placeholder={item.rule_type === "custom" ? "Optional" : undefined}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}

                <Controller
                  name={`items.${index}.cutoff_scope`}
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={`rule-${index}-scope`}>When</FieldLabel>
                      <Select
                        value={item.rule_type === "monthly_split" ? "every" : field.value}
                        onValueChange={field.onChange}
                        disabled={item.rule_type === "monthly_split"}
                      >
                        <SelectTrigger id={`rule-${index}-scope`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SCOPE_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 self-end"
                  aria-label="Remove this rule"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-5">
                  <Controller
                    name={`items.${index}.rollover`}
                    control={form.control}
                    render={({ field }) => (
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(c) => field.onChange(c === true)}
                        />
                        Carry what&apos;s left into the next cutoff
                      </label>
                    )}
                  />

                  {kind && kind !== "spending" && (
                    <Controller
                      name={`items.${index}.destination_account_id`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="horizontal"
                          className="w-auto"
                        >
                          <FieldLabel
                            htmlFor={`rule-${index}-account`}
                            className="whitespace-nowrap"
                          >
                            Save into
                          </FieldLabel>
                          <Autocomplete
                            id={`rule-${index}-account`}
                            className="w-52"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={accountChoices}
                            loading={accounts.isLoading}
                            placeholder="No specific account"
                            emptyMessage="No accounts match."
                            invalid={fieldState.invalid}
                            clearable
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  )}
                  {err?.root?.message && <FieldError>{err.root.message}</FieldError>}
                </div>
              </li>
            );
          })}
        </ol>

        <Button type="button" variant="outline" onClick={() => append(newRule())}>
          <Plus className="size-4" aria-hidden />
          Add rule
        </Button>
      </section>

      {rootError && (
        <Alert variant="destructive">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
