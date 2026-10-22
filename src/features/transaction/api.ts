import { z } from "zod";

import axios from "@/lib/axios";
import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountOptionsResSchema,
  categoryOptionsResSchema,
  paymentMethodOptionsResSchema,
  receiptListResSchema,
  receiptResSchema,
  toTransactionPayload,
  transactionListResSchema,
  transactionResSchema,
  type TransactionFilters,
  type TransactionFormValues,
} from "./schema";

/** Drops empty filters so the query string only carries what's set. */
export const cleanFilters = (filters: TransactionFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  );

export const fetchTransactions = (filters: TransactionFilters) =>
  request({
    config: { method: "GET", url: "transactions", params: cleanFilters(filters) },
    schema: transactionListResSchema,
  });

export const createTransaction = (values: TransactionFormValues) =>
  request({
    config: { method: "POST", url: "transactions", data: toTransactionPayload(values) },
    schema: transactionResSchema,
  });

export const updateTransaction = (id: string, values: TransactionFormValues) =>
  request({
    config: { method: "PUT", url: `transactions/${id}`, data: toTransactionPayload(values) },
    schema: transactionResSchema,
  });

export const deleteTransaction = (id: string) =>
  request({ config: { method: "DELETE", url: `transactions/${id}` }, schema: resSchema });

/** Streamed CSV with the list's filters and sort; the export covers every page, so paging is dropped. */
export async function exportTransactions(filters: TransactionFilters) {
  const response = await axios.post<Blob>("transactions/export", null, {
    params: cleanFilters({ ...filters, page: null, per_page: null }),
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : "transactions.csv";

  const href = URL.createObjectURL(response.data);
  const link = Object.assign(document.createElement("a"), { href, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

// Pickers: `status=all` so archived names still show on old rows and in filters.
export const fetchAccountOptions = () =>
  request({
    config: { method: "GET", url: "accounts", params: { status: "all" } },
    schema: accountOptionsResSchema,
  });

export const fetchCategoryOptions = () =>
  request({
    config: { method: "GET", url: "categories", params: { status: "all" } },
    schema: categoryOptionsResSchema,
  });

export const fetchPaymentMethodOptions = () =>
  request({
    config: { method: "GET", url: "payment-methods", params: { status: "all" } },
    schema: paymentMethodOptionsResSchema,
  });

export const fetchReceipts = (transactionId: string) =>
  request({
    config: { method: "GET", url: `transactions/${transactionId}/attachments` },
    schema: receiptListResSchema,
  });

export const uploadReceipt = (transactionId: string, file: File) => {
  const data = new FormData();
  data.append("file", file);

  return request({
    config: { method: "POST", url: `transactions/${transactionId}/attachments`, data },
    schema: receiptResSchema,
  });
};

export const deleteReceipt = (receiptId: string) =>
  request({ config: { method: "DELETE", url: `attachments/${receiptId}` }, schema: z.unknown() });
