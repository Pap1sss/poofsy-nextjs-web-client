import { z } from "zod";

export type Response = z.infer<typeof resSchema>;
export const resSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ErrorRes = z.infer<typeof errorResSchema>;
export const errorResSchema = resSchema;

export type ValidationErrorRes = z.infer<typeof validationErrorResSchema>;
export const validationErrorResSchema = errorResSchema.extend({
  errors: z.record(z.string(), z.array(z.string())),
});

export type Link = z.infer<typeof linkSchema>;
export const linkSchema = z.object({
  url: z.string().nullable(),
  label: z.string(),
  active: z.boolean(),
});

export type Pagination = z.infer<typeof paginationSchema>;
export const paginationSchema = z.object({
  current_page: z.number(),
  first_page_url: z.string(),
  from: z.number().nullable(),
  last_page: z.number(),
  last_page_url: z.string(),
  links: z.array(linkSchema),
  next_page_url: z.string().nullable(),
  path: z.string(),
  per_page: z.number(),
  prev_page_url: z.string().nullable(),
  to: z.number().nullable(),
  total: z.number(),
});

const linksSchema = z.object({
  first: z.string(),
  last: z.string(),
  prev: z.string().nullable(),
  next: z.string().nullable(),
});

const metaLinksSchema = z.object({
  url: z.string().nullable(),
  label: z.string(),
  active: z.boolean(),
});

const metaSchema = z.object({
  current_page: z.number(),
  from: z.number().nullable(),
  last_page: z.number(),
  links: z.array(metaLinksSchema),
  path: z.string(),
  per_page: z.number(),
  to: z.number().nullable(),
  total: z.number(),
});

export type ApiPaginatedRes = z.infer<typeof apiPaginatedResSchema>;
export const apiPaginatedResSchema = z.object({
  links: linksSchema,
  meta: metaSchema,
});

export type OptionSchema = z.infer<typeof optionSchema>;
export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type OptionResSchema = z.infer<typeof optionResSchema>;
export const optionResSchema = resSchema.extend({
  data: z.array(optionSchema),
});

export type TabLinkSchema = {
  title: string;
  url: string | ((id: string) => string);
};
