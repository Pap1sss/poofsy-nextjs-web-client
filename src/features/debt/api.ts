import axios from "@/lib/axios";
import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountOptionsResSchema,
  categoryOptionsResSchema,
  debtListResSchema,
  debtResSchema,
  paymentMethodOptionsResSchema,
  peopleResSchema,
  personResSchema,
  type DebtFilters,
  type DebtFormValues,
  type PersonFormValues,
  type SettlementFormValues,
} from "./schema";

const blankToNull = (value: string | undefined) => (value?.trim() ? value.trim() : null);

/** Only the filters the API knows, without empty ones; "all" statuses means no status filter. */
const toParams = (filters: DebtFilters) =>
  Object.fromEntries(
    Object.entries({ ...filters, status: filters.status === "all" ? null : filters.status }).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  );

const toDebtPayload = (values: DebtFormValues, creating: boolean) => ({
  // An existing person by id, or a typed name (the API adds the person if they're new).
  ...(values.person_id
    ? { person_id: values.person_id }
    : { person_name: (values.person_name ?? "").trim() }),
  original_amount: values.original_amount,
  debt_date: values.debt_date,
  due_date: blankToNull(values.due_date),
  description: values.description.trim(),
  notes: blankToNull(values.notes),
  reference_number: blankToNull(values.reference_number),
  ...(creating
    ? {
        direction: values.direction,
        record_in_account: values.record_in_account,
        account_id: values.record_in_account ? blankToNull(values.account_id) : null,
      }
    : {}),
});

const toSettlementPayload = (values: SettlementFormValues, creating: boolean) => ({
  amount: values.amount,
  settlement_date: values.settlement_date,
  payment_method_id: blankToNull(values.payment_method_id),
  reference_number: blankToNull(values.reference_number),
  notes: blankToNull(values.notes),
  ...(creating
    ? {
        record_as: values.record_as,
        account_id: values.record_as === "none" ? null : blankToNull(values.account_id),
        category_id: blankToNull(values.category_id),
      }
    : {}),
});

export const debtApi = {
  list: (filters: DebtFilters) =>
    request({
      config: { method: "GET", url: "debts", params: toParams(filters) },
      schema: debtListResSchema,
    }),

  show: (id: string) =>
    request({ config: { method: "GET", url: `debts/${id}` }, schema: debtResSchema }),

  create: (values: DebtFormValues) =>
    request({
      config: { method: "POST", url: "debts", data: toDebtPayload(values, true) },
      schema: debtResSchema,
    }),

  update: (id: string, values: DebtFormValues) =>
    request({
      config: { method: "PUT", url: `debts/${id}`, data: toDebtPayload(values, false) },
      schema: debtResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `debts/${id}` }, schema: resSchema }),

  cancel: (id: string, reason: string) =>
    request({
      config: { method: "POST", url: `debts/${id}/cancel`, data: { reason: blankToNull(reason) } },
      schema: debtResSchema,
    }),

  reopen: (id: string) =>
    request({ config: { method: "POST", url: `debts/${id}/reopen` }, schema: debtResSchema }),

  settle: (id: string, values: SettlementFormValues, idempotencyKey: string) =>
    request({
      config: {
        method: "POST",
        url: `debts/${id}/settlements`,
        data: toSettlementPayload(values, true),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      schema: debtResSchema,
    }),

  correctSettlement: (debtId: string, settlementId: string, values: SettlementFormValues) =>
    request({
      config: {
        method: "PUT",
        url: `debts/${debtId}/settlements/${settlementId}`,
        data: toSettlementPayload(values, false),
      },
      schema: debtResSchema,
    }),

  voidSettlement: (debtId: string, settlementId: string, reason: string) =>
    request({
      config: {
        method: "POST",
        url: `debts/${debtId}/settlements/${settlementId}/void`,
        data: { reason: reason.trim() },
      },
      schema: debtResSchema,
    }),

  people: () => request({ config: { method: "GET", url: "people" }, schema: peopleResSchema }),

  person: (id: string) =>
    request({ config: { method: "GET", url: `people/${id}` }, schema: personResSchema }),

  updatePerson: (id: string, values: PersonFormValues) =>
    request({
      config: {
        method: "PUT",
        url: `people/${id}`,
        data: { name: values.name.trim(), notes: blankToNull(values.notes) },
      },
      schema: personResSchema,
    }),

  removePerson: (id: string) =>
    request({ config: { method: "DELETE", url: `people/${id}` }, schema: resSchema }),

  accounts: () =>
    request({
      config: { method: "GET", url: "accounts", params: { status: "active" } },
      schema: accountOptionsResSchema,
    }),

  categories: () =>
    request({
      config: { method: "GET", url: "categories", params: { status: "active" } },
      schema: categoryOptionsResSchema,
    }),

  paymentMethods: () =>
    request({
      config: { method: "GET", url: "payment-methods", params: { status: "active" } },
      schema: paymentMethodOptionsResSchema,
    }),
};

/** Streamed CSV with the list's filters, saved under the server's filename. */
export async function exportDebts(filters: DebtFilters) {
  const response = await axios.post<Blob>("debts/export", null, {
    params: toParams(filters),
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : "debts.csv";

  const href = URL.createObjectURL(response.data);
  const link = Object.assign(document.createElement("a"), { href, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
