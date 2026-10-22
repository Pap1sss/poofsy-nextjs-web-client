import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";
import { CATEGORY_KINDS } from "@/features/budget/schema";

export const RULE_TYPES = ["fixed", "monthly_split", "percentage", "custom"] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const CUTOFF_SCOPES = ["every", "first", "second"] as const;
export type CutoffScope = (typeof CUTOFF_SCOPES)[number];

// Matches BudgetTemplateResource. `items_count` comes with the list, `items` with a single template.
export type TemplateItem = z.infer<typeof templateItemSchema>;
export const templateItemSchema = z.object({
  id: z.string(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
      kind: z.enum(CATEGORY_KINDS),
    })
    .nullable(),
  rule_type: z.enum(RULE_TYPES),
  amount: moneySchema.nullable(),
  percentage: z.string().nullable(),
  cutoff_scope: z.enum(CUTOFF_SCOPES),
  rollover: z.boolean(),
  destination_account: z.object({ id: z.string(), name: z.string() }).nullable(),
});

export type BudgetTemplate = z.infer<typeof templateSchema>;
export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_default: z.boolean(),
  items_count: z.number().optional(),
  items: z.array(templateItemSchema).optional(),
  updated_at: z.string().nullable(),
});

export const templateResSchema = resSchema.extend({ data: templateSchema });
export const templatesResSchema = resSchema.extend({ data: z.array(templateSchema) });

// The editor form. Amounts stay strings; the API validates and rounds them.
export type TemplateFormValues = z.infer<typeof TemplateFormSchema>;
export const TemplateFormSchema = z
  .object({
    name: z.string().trim().min(1, "Give the template a name.").max(100),
    items: z.array(
      z.object({
        category_id: z.string().min(1, "Choose a category."),
        rule_type: z.enum(RULE_TYPES),
        amount: z.string(),
        percentage: z.string(),
        cutoff_scope: z.enum(CUTOFF_SCOPES),
        rollover: z.boolean(),
        destination_account_id: z.string(),
      })
    ),
  })
  .superRefine(({ items }, ctx) => {
    const seen = new Set<string>();

    items.forEach((item, index) => {
      if (item.category_id && seen.has(item.category_id)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "category_id"],
          message: "This category already has a rule.",
        });
      }
      seen.add(item.category_id);

      if ((item.rule_type === "fixed" || item.rule_type === "monthly_split") && !item.amount) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "amount"],
          message: "Enter an amount.",
        });
      }

      if (item.rule_type === "percentage") {
        const pct = Number(item.percentage);
        if (!item.percentage || Number.isNaN(pct) || pct < 0 || pct > 100) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "percentage"],
            message: "Enter a percentage from 0 to 100.",
          });
        }
      }
    });
  });

export const ITEM_FIELDS = [
  "category_id",
  "rule_type",
  "amount",
  "percentage",
  "cutoff_scope",
  "rollover",
  "destination_account_id",
] as const;

/** Only the fields that apply to each rule type go to the API. */
export function toTemplatePayload(values: TemplateFormValues) {
  return {
    name: values.name,
    items: values.items.map((item) => ({
      category_id: item.category_id,
      rule_type: item.rule_type,
      amount: item.rule_type === "percentage" ? null : item.amount || null,
      percentage: item.rule_type === "percentage" ? item.percentage : null,
      cutoff_scope: item.rule_type === "monthly_split" ? "every" : item.cutoff_scope,
      rollover: item.rollover,
      destination_account_id: item.destination_account_id || null,
    })),
  };
}

export function toTemplateFormValues(template: BudgetTemplate): TemplateFormValues {
  return {
    name: template.name,
    items: (template.items ?? []).map((item) => ({
      category_id: item.category?.id ?? "",
      rule_type: item.rule_type,
      amount: item.amount?.amount ?? "",
      percentage: item.percentage ?? "",
      cutoff_scope: item.cutoff_scope,
      rollover: item.rollover,
      destination_account_id: item.destination_account?.id ?? "",
    })),
  };
}
