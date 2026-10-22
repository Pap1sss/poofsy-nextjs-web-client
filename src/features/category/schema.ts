import { z } from "zod";

import { resSchema } from "@/lib/schemas";

export const CATEGORY_KINDS = ["spending", "savings", "investment"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  spending: "Spending",
  savings: "Savings",
  investment: "Investment",
};

// Matches App\Http\Resources\CategoryResource.
export type Category = z.infer<typeof categorySchema>;
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(CATEGORY_KINDS),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  sort_order: z.number(),
  is_essential: z.boolean(),
  is_default: z.boolean(),
  usage_count: z.number().nullable(),
  archived_at: z.string().nullable(),
  /** Edit version: sent back on update so the API can refuse a save made elsewhere in between (409). */
  updated_at: z.string().nullable().optional(),
});

export const categoryListResSchema = resSchema.extend({ data: z.array(categorySchema) });
export const categoryResSchema = resSchema.extend({ data: categorySchema });

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;
export const CategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Give the category a name.").max(60),
  kind: z.enum(CATEGORY_KINDS),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour."),
  icon: z
    .string()
    .trim()
    .max(64)
    .regex(/^[a-z0-9-]*$/, "Use a Lucide icon name in lower case, like shopping-bag."),
  is_essential: z.boolean(),
});
