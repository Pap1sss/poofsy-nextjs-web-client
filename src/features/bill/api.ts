import { TRACK_ONLY } from "@/features/transaction/schema";
import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountOptionsResSchema,
  billListResSchema,
  billResSchema,
  categoryOptionsResSchema,
  occurrenceListResSchema,
  occurrenceResSchema,
  paymentMethodOptionsResSchema,
  payResSchema,
  toRRule,
  type BillFormValues,
  type PayFormValues,
} from "./schema";

export type BillStatus = "active" | "inactive" | "all";
export type OccurrenceFilter = "upcoming" | "overdue" | "paid" | "skipped";

const blankToNull = (value: string) => (value.trim() === "" ? null : value);

const toPayload = (values: BillFormValues) => ({
  name: values.name.trim(),
  amount: values.amount,
  category_id: blankToNull(values.category_id),
  account_id: blankToNull(values.account_id),
  recurrence: values.custom_rule || toRRule(values),
  start_date: values.start_date,
  reminder_days_before: Number(values.reminder_days_before),
  notes: blankToNull(values.notes),
  active: values.active,
});

export const billApi = {
  list: (status: BillStatus) =>
    request({
      config: { method: "GET", url: "bills", params: { status } },
      schema: billListResSchema,
    }),

  occurrences: (status: OccurrenceFilter) =>
    request({
      config: { method: "GET", url: "bills/occurrences", params: { status } },
      schema: occurrenceListResSchema,
    }),

  create: (values: BillFormValues) =>
    request({
      config: { method: "POST", url: "bills", data: toPayload(values) },
      schema: billResSchema,
    }),

  update: (id: string, values: BillFormValues) =>
    request({
      config: { method: "PUT", url: `bills/${id}`, data: toPayload(values) },
      schema: billResSchema,
    }),

  /** Deactivate or reactivate without touching anything else. */
  setActive: (id: string, active: boolean) =>
    request({
      config: { method: "PUT", url: `bills/${id}`, data: { active } },
      schema: billResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `bills/${id}` }, schema: resSchema }),

  /** The key is generated once per pay dialog, so a retried request can never pay twice. */
  pay: (billId: string, occurrenceId: string, values: PayFormValues, idempotencyKey: string) =>
    request({
      config: {
        method: "POST",
        url: `bills/${billId}/pay`,
        headers: { "Idempotency-Key": idempotencyKey },
        data: {
          occurrence_id: occurrenceId,
          // Track-only: recorded as an expense, but no account balance changes (D25).
          account_id: values.account_id === TRACK_ONLY ? null : values.account_id,
          track_only: values.account_id === TRACK_ONLY,
          amount: values.amount,
          paid_on: values.paid_on,
          payment_method_id: blankToNull(values.payment_method_id),
        },
      },
      schema: payResSchema,
    }),

  skip: (occurrenceId: string) =>
    request({
      config: { method: "POST", url: `bill-occurrences/${occurrenceId}/skip` },
      schema: occurrenceResSchema,
    }),

  unskip: (occurrenceId: string) =>
    request({
      config: { method: "POST", url: `bill-occurrences/${occurrenceId}/unskip` },
      schema: occurrenceResSchema,
    }),

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
