import { z } from "zod";
import { resSchema, apiPaginatedResSchema } from "@/lib/schemas";

// The nested payload stored in Laravel's database notification `data` column
export type NotificationData = z.infer<typeof notificationDataSchema>;
export const notificationDataSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  success: z.boolean().nullable().optional(),

  // The glyph the server asks for, resolved against KIND_ICON in
  // notification-item.tsx. Declared here because z.object strips what it does
  // not know, so an undeclared field never reaches the component at all.
  icon: z.string().nullable().optional(),

  // The headline split into runs so the client knows which words to emphasise —
  // it cannot infer that from a flat string. Optional: a notification with
  // nothing worth bolding just sends `title` and renders unemphasised.
  segments: z
    .array(z.object({ text: z.string(), bold: z.boolean().nullable().optional() }))
    .nullable()
    .optional(),
  data: z
    .object({
      download_link: z.string().nullable().optional(),
      stats: z
        .object({
          created: z.number(),
          total_skipped: z.number(),
          duplicates_count: z.number(),
          errors_count: z.number(),
        })
        .nullable()
        .optional(),
      duplicates: z.array(z.unknown()).nullable().optional(),
      errors: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type NotificationItemType = z.infer<typeof notificationItemSchema>;
export const notificationItemSchema = z.object({
  id: z.string(),
  type: z.string().nullable().optional(),
  data: notificationDataSchema.nullable().optional(),
  read_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type NotificationListResSchema = z.infer<typeof notificationListResSchema>;
export const notificationListResSchema = resSchema.extend({
  data: apiPaginatedResSchema.extend({
    data: z.array(notificationItemSchema),
  }),
  summary: z.object({
    unread_count: z.number(),
  }),
});

export type NotificationOverview = z.infer<typeof notificationOverviewSchema>;
export const notificationOverviewSchema = z.object({
  unread_count: z.number(),
});

export type NotificationOverviewResSchema = z.infer<typeof notificationOverviewResSchema>;
export const notificationOverviewResSchema = resSchema.extend({
  data: z.object({
    data: z.array(notificationItemSchema),
  }),
  summary: notificationOverviewSchema,
});
