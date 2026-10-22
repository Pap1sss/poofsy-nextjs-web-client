import { z } from "zod";

import { resSchema, apiPaginatedResSchema } from "@/lib/schemas";

export type SystemActivityListItem = z.infer<typeof systemActivityListItemSchema>;
export const systemActivityListItemSchema = z.object({
  id: z.string(),
  created_at: z.string().nullable().optional(),

  log_name: z.string(),
  description: z.string(),
  event: z.string(),
  subject_id: z.string().nullable().optional(),
  subject_type: z.string().nullable().optional(),
  causer_id: z.string().nullable().optional(),
  causer_name: z.string().nullable().optional(),
});

export type SystemActivityListSchema = z.infer<typeof systemActivityListSchema>;
export const systemActivityListSchema = z.array(systemActivityListItemSchema);

export type SystemActivityListResSchema = z.infer<typeof systemActivityListResSchema>;
export const systemActivityListResSchema = resSchema.extend({
  data: systemActivityListSchema,
});

export type SystemActivityListPaginatedResSchema = z.infer<
  typeof systemActivityListPaginatedResSchema
>;

export const systemActivityListPaginatedResSchema = resSchema.extend({
  data: apiPaginatedResSchema.extend({
    data: systemActivityListSchema,
  }),
});
