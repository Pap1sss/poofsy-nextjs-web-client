import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import { categoryListResSchema, categoryResSchema, type CategoryFormValues } from "./schema";

export type ListStatus = "active" | "archived";

const toPayload = ({ icon, ...rest }: CategoryFormValues) => ({
  ...rest,
  icon: icon === "" ? null : icon,
});

export const categoryApi = {
  list: (status: ListStatus = "active") =>
    request({
      config: { method: "GET", url: "categories", params: { status } },
      schema: categoryListResSchema,
    }),

  create: (values: CategoryFormValues) =>
    request({
      config: { method: "POST", url: "categories", data: toPayload(values) },
      schema: categoryResSchema,
    }),

  update: (id: string, values: CategoryFormValues, version?: string | null) =>
    request({
      config: {
        method: "PUT",
        url: `categories/${id}`,
        data: { ...toPayload(values), ...(version ? { version } : {}) },
      },
      schema: categoryResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `categories/${id}` }, schema: resSchema }),

  archive: (id: string) =>
    request({
      config: { method: "POST", url: `categories/${id}/archive` },
      schema: categoryResSchema,
    }),

  restore: (id: string) =>
    request({
      config: { method: "POST", url: `categories/${id}/restore` },
      schema: categoryResSchema,
    }),

  reorder: (ids: string[]) =>
    request({
      config: { method: "POST", url: "categories/reorder", data: { ids } },
      schema: resSchema,
    }),

  merge: (id: string, targetId: string) =>
    request({
      config: { method: "POST", url: `categories/${id}/merge`, data: { target_id: targetId } },
      schema: categoryResSchema,
    }),

  restoreDefaults: () =>
    request({
      config: { method: "POST", url: "categories/restore-defaults" },
      schema: categoryListResSchema,
    }),
};
