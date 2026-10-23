import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountListResSchema,
  accountOptionsResSchema,
  accountResSchema,
  categoryOptionsResSchema,
  expenseOptionsResSchema,
  installmentListResSchema,
  overviewResSchema,
  paymentMethodOptionsResSchema,
  paymentResSchema,
  prefsResSchema,
  previewResSchema,
  purchaseListResSchema,
  purchaseResSchema,
  type AccountFormValues,
  type PaymentFormValues,
  type PrefsFormValues,
  type PurchaseDetailsValues,
  type PurchaseFilters,
  type PurchaseFormValues,
  type ScheduleFormValues,
} from "./schema";

const blankToNull = (value: string | undefined) => (value?.trim() ? value.trim() : null);

/** Only the filters the API knows, without empty ones; "all" statuses means no status filter. */
const toParams = (filters: Partial<PurchaseFilters>) =>
  Object.fromEntries(
    Object.entries({ ...filters, status: filters.status === "all" ? null : filters.status }).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  );

const toAccountPayload = (values: AccountFormValues) => ({
  provider_name: values.provider_name.trim(),
  nickname: blankToNull(values.nickname),
  credit_limit: blankToNull(values.credit_limit),
  available_credit: blankToNull(values.available_credit),
  due_day: values.due_day ? Number(values.due_day) : null,
  notes: blankToNull(values.notes),
});

const toDetailsPayload = (values: PurchaseDetailsValues) => ({
  paylater_account_id: values.paylater_account_id,
  category_id: blankToNull(values.category_id),
  description: values.description.trim(),
  merchant: blankToNull(values.merchant),
  order_reference: blankToNull(values.order_reference),
  purchase_date: values.purchase_date,
  original_amount: values.original_amount,
  down_payment: blankToNull(values.down_payment) ?? "0",
  fees: blankToNull(values.fees) ?? "0",
  other_charges: blankToNull(values.other_charges) ?? "0",
  interest_rate: blankToNull(values.interest_rate),
  notes: blankToNull(values.notes),
});

const toSchedule = (rows: ScheduleFormValues["installments"]) =>
  rows.map((row) => ({
    ...(row.id ? { id: row.id } : {}),
    due_date: row.due_date,
    amount: row.amount,
  }));

const toPaymentPayload = (values: PaymentFormValues, creating: boolean) => ({
  amount: values.amount,
  payment_date: values.payment_date,
  payment_method_id: blankToNull(values.payment_method_id),
  reference_number: blankToNull(values.reference_number),
  notes: blankToNull(values.notes),
  ...(creating
    ? {
        record_as: values.record_as,
        ...(values.record_as === "expense"
          ? {
              account_id: blankToNull(values.account_id),
              category_id: blankToNull(values.category_id),
            }
          : {}),
        ...(values.record_as === "link"
          ? { transaction_id: blankToNull(values.transaction_id) }
          : {}),
      }
    : {}),
});

export type PaymentScope = { purchaseId?: string; installmentId?: string };

export const paylaterApi = {
  overview: () =>
    request({ config: { method: "GET", url: "paylater" }, schema: overviewResSchema }),

  installments: (params: { status?: string; from?: string; to?: string; account_id?: string }) =>
    request({
      config: { method: "GET", url: "paylater/installments", params },
      schema: installmentListResSchema,
    }),

  previewSchedule: (data: {
    original_amount: string;
    down_payment: string | null;
    fees: string | null;
    other_charges: string | null;
    total_repayment: string | null;
    installment_count: number;
    first_due_date: string;
  }) =>
    request({
      config: { method: "POST", url: "paylater/preview-schedule", data },
      schema: previewResSchema,
    }),

  updatePrefs: (values: PrefsFormValues) =>
    request({
      config: {
        method: "PUT",
        url: "paylater/settings",
        data: {
          reminder_days_before: values.reminders_on
            ? Number(values.reminder_days_before || 0)
            : null,
          remind_due_today: values.remind_due_today,
          remind_overdue: values.remind_overdue,
          monthly_limit: blankToNull(values.monthly_limit),
          budget_percent: blankToNull(values.budget_percent) ? Number(values.budget_percent) : null,
        },
      },
      schema: prefsResSchema,
    }),

  accounts: (status: "active" | "archived" | "all" = "active") =>
    request({
      config: { method: "GET", url: "paylater-accounts", params: { status } },
      schema: accountListResSchema,
    }),

  account: (id: string) =>
    request({
      config: { method: "GET", url: `paylater-accounts/${id}` },
      schema: accountResSchema,
    }),

  saveAccount: (id: string | undefined, values: AccountFormValues) =>
    request({
      config: {
        method: id ? "PUT" : "POST",
        url: id ? `paylater-accounts/${id}` : "paylater-accounts",
        data: toAccountPayload(values),
      },
      schema: accountResSchema,
    }),

  archiveAccount: (id: string) =>
    request({
      config: { method: "POST", url: `paylater-accounts/${id}/archive` },
      schema: accountResSchema,
    }),

  restoreAccount: (id: string) =>
    request({
      config: { method: "POST", url: `paylater-accounts/${id}/restore` },
      schema: accountResSchema,
    }),

  removeAccount: (id: string) =>
    request({ config: { method: "DELETE", url: `paylater-accounts/${id}` }, schema: resSchema }),

  purchases: (filters: Partial<PurchaseFilters>) =>
    request({
      config: { method: "GET", url: "paylater-purchases", params: toParams(filters) },
      schema: purchaseListResSchema,
    }),

  purchase: (id: string) =>
    request({
      config: { method: "GET", url: `paylater-purchases/${id}` },
      schema: purchaseResSchema,
    }),

  createPurchase: (values: PurchaseFormValues) =>
    request({
      config: {
        method: "POST",
        url: "paylater-purchases",
        data: {
          ...toDetailsPayload(values),
          total_repayment: values.total_repayment,
          installments: toSchedule(values.installments),
          record_down_payment: values.record_down_payment,
          down_payment_account_id: values.record_down_payment
            ? blankToNull(values.down_payment_account_id)
            : null,
        },
      },
      schema: purchaseResSchema,
    }),

  updatePurchase: (id: string, values: PurchaseDetailsValues) =>
    request({
      config: { method: "PUT", url: `paylater-purchases/${id}`, data: toDetailsPayload(values) },
      schema: purchaseResSchema,
    }),

  updateSchedule: (id: string, values: ScheduleFormValues) =>
    request({
      config: {
        method: "PUT",
        url: `paylater-purchases/${id}/schedule`,
        data: {
          total_repayment: values.total_repayment,
          installments: toSchedule(values.installments),
        },
      },
      schema: purchaseResSchema,
    }),

  cancelPurchase: (id: string, reason: string) =>
    request({
      config: {
        method: "POST",
        url: `paylater-purchases/${id}/cancel`,
        data: { reason: blankToNull(reason) },
      },
      schema: purchaseResSchema,
    }),

  reopenPurchase: (id: string) =>
    request({
      config: { method: "POST", url: `paylater-purchases/${id}/reopen` },
      schema: purchaseResSchema,
    }),

  removePurchase: (id: string) =>
    request({ config: { method: "DELETE", url: `paylater-purchases/${id}` }, schema: resSchema }),

  pay: (
    accountId: string,
    scope: PaymentScope,
    values: PaymentFormValues,
    idempotencyKey: string
  ) =>
    request({
      config: {
        method: "POST",
        url: `paylater-accounts/${accountId}/payments`,
        data: {
          ...toPaymentPayload(values, true),
          paylater_purchase_id: scope.purchaseId ?? null,
          paylater_installment_id: scope.installmentId ?? null,
        },
        headers: { "Idempotency-Key": idempotencyKey },
      },
      schema: paymentResSchema,
    }),

  correctPayment: (id: string, values: PaymentFormValues) =>
    request({
      config: {
        method: "PUT",
        url: `paylater-payments/${id}`,
        data: toPaymentPayload(values, false),
      },
      schema: paymentResSchema,
    }),

  voidPayment: (id: string, reason: string) =>
    request({
      config: {
        method: "POST",
        url: `paylater-payments/${id}/void`,
        data: { reason: reason.trim() },
      },
      schema: paymentResSchema,
    }),

  cashAccounts: () =>
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

  /** Expenses to link a payment to, searched on the server. */
  searchExpenses: (search: string, signal: AbortSignal) =>
    request({
      config: {
        method: "GET",
        url: "transactions",
        params: {
          type: "expense",
          search: search || undefined,
          per_page: 20,
          sort: "-transaction_date",
        },
        signal,
      },
      schema: expenseOptionsResSchema,
    }),
};
