import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountListResSchema,
  accountResSchema,
  reconcileResSchema,
  signedAmount,
  type AccountFormValues,
} from "./schema";

export type ListStatus = "active" | "archived";

const toPayload = ({ below_zero, starting_balance, notes, ...rest }: AccountFormValues) => ({
  ...rest,
  starting_balance: signedAmount(starting_balance, below_zero),
  notes: notes.trim() === "" ? null : notes,
});

export const accountApi = {
  list: (status: ListStatus = "active") =>
    request({
      config: { method: "GET", url: "accounts", params: { status } },
      schema: accountListResSchema,
    }),

  create: (values: AccountFormValues) =>
    request({
      config: { method: "POST", url: "accounts", data: toPayload(values) },
      schema: accountResSchema,
    }),

  update: (id: string, values: AccountFormValues) =>
    request({
      config: { method: "PUT", url: `accounts/${id}`, data: toPayload(values) },
      schema: accountResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `accounts/${id}` }, schema: resSchema }),

  archive: (id: string) =>
    request({
      config: { method: "POST", url: `accounts/${id}/archive` },
      schema: accountResSchema,
    }),

  restore: (id: string) =>
    request({
      config: { method: "POST", url: `accounts/${id}/restore` },
      schema: accountResSchema,
    }),

  reconcile: (id: string, statementBalance: string, notes: string) =>
    request({
      config: {
        method: "POST",
        url: `accounts/${id}/reconcile`,
        data: { statement_balance: statementBalance, notes: notes.trim() === "" ? null : notes },
      },
      schema: reconcileResSchema,
    }),
};
