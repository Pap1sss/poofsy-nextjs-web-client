import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import { templateResSchema, templatesResSchema } from "./schema";

type TemplatePayload = {
  name?: string;
  is_default?: boolean;
  items?: Record<string, unknown>[];
};

export const getTemplates = () =>
  request({ config: { method: "GET", url: "budget-templates" }, schema: templatesResSchema });

export const getTemplate = (id: string) =>
  request({ config: { method: "GET", url: `budget-templates/${id}` }, schema: templateResSchema });

export const createTemplate = (data: TemplatePayload) =>
  request({ config: { method: "POST", url: "budget-templates", data }, schema: templateResSchema });

export const updateTemplate = (id: string, data: TemplatePayload) =>
  request({
    config: { method: "PUT", url: `budget-templates/${id}`, data },
    schema: templateResSchema,
  });

export const duplicateTemplate = (id: string) =>
  request({
    config: { method: "POST", url: `budget-templates/${id}/duplicate` },
    schema: templateResSchema,
  });

export const deleteTemplate = (id: string) =>
  request({ config: { method: "DELETE", url: `budget-templates/${id}` }, schema: resSchema });
