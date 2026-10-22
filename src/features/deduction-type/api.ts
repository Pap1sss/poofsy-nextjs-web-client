import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  deductionTypeListResSchema,
  deductionTypeResSchema,
  type DeductionTypeFormValues,
} from "./schema";

export type ListStatus = "active" | "archived";

const toPayload = ({ name, default_amount }: DeductionTypeFormValues) => ({
  name,
  default_amount: default_amount === "" ? null : default_amount,
});

export const deductionTypeApi = {
  list: (status: ListStatus = "active") =>
    request({
      config: { method: "GET", url: "deduction-types", params: { status } },
      schema: deductionTypeListResSchema,
    }),

  create: (values: DeductionTypeFormValues) =>
    request({
      config: { method: "POST", url: "deduction-types", data: toPayload(values) },
      schema: deductionTypeResSchema,
    }),

  update: (id: string, values: DeductionTypeFormValues) =>
    request({
      config: { method: "PUT", url: `deduction-types/${id}`, data: toPayload(values) },
      schema: deductionTypeResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `deduction-types/${id}` }, schema: resSchema }),

  archive: (id: string) =>
    request({
      config: { method: "POST", url: `deduction-types/${id}/archive` },
      schema: deductionTypeResSchema,
    }),

  restore: (id: string) =>
    request({
      config: { method: "POST", url: `deduction-types/${id}/restore` },
      schema: deductionTypeResSchema,
    }),
};
