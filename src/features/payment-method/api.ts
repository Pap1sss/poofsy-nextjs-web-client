import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  NO_ACCOUNT,
  paymentMethodListResSchema,
  paymentMethodResSchema,
  type PaymentMethodFormValues,
} from "./schema";

export type ListStatus = "active" | "archived";

const toPayload = ({ name, account_id }: PaymentMethodFormValues) => ({
  name,
  account_id: account_id === NO_ACCOUNT ? null : account_id,
});

export const paymentMethodApi = {
  list: (status: ListStatus = "active") =>
    request({
      config: { method: "GET", url: "payment-methods", params: { status } },
      schema: paymentMethodListResSchema,
    }),

  create: (values: PaymentMethodFormValues) =>
    request({
      config: { method: "POST", url: "payment-methods", data: toPayload(values) },
      schema: paymentMethodResSchema,
    }),

  update: (id: string, values: PaymentMethodFormValues) =>
    request({
      config: { method: "PUT", url: `payment-methods/${id}`, data: toPayload(values) },
      schema: paymentMethodResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `payment-methods/${id}` }, schema: resSchema }),

  archive: (id: string) =>
    request({
      config: { method: "POST", url: `payment-methods/${id}/archive` },
      schema: paymentMethodResSchema,
    }),

  restore: (id: string) =>
    request({
      config: { method: "POST", url: `payment-methods/${id}/restore` },
      schema: paymentMethodResSchema,
    }),
};
