import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountOptionsResSchema,
  deductionTypeOptionsResSchema,
  incomeRecordListResSchema,
  incomeRecordResSchema,
  incomeSourceListResSchema,
  incomeSourceResSchema,
  payPeriodOptionsResSchema,
  toIncomeRecordPayload,
  type IncomeRecordFormValues,
  type IncomeSourceFormValues,
  type PayChangeFormValues,
} from "./schema";

export const incomeApi = {
  listRecords: (params: { page: number; pay_period_id?: string }) =>
    request({
      config: { method: "GET", url: "incomes", params: { per_page: 20, ...params } },
      schema: incomeRecordListResSchema,
    }),

  createRecord: (values: IncomeRecordFormValues) =>
    request({
      config: { method: "POST", url: "incomes", data: toIncomeRecordPayload(values) },
      schema: incomeRecordResSchema,
    }),

  updateRecord: (id: string, values: IncomeRecordFormValues) =>
    request({
      config: { method: "PUT", url: `incomes/${id}`, data: toIncomeRecordPayload(values) },
      schema: incomeRecordResSchema,
    }),

  deleteRecord: (id: string) =>
    request({ config: { method: "DELETE", url: `incomes/${id}` }, schema: resSchema }),

  listSources: (status: "active" | "all") =>
    request({
      config: { method: "GET", url: "income-sources", params: { status } },
      schema: incomeSourceListResSchema,
    }),

  createSource: (values: IncomeSourceFormValues) =>
    request({
      config: { method: "POST", url: "income-sources", data: values },
      schema: incomeSourceResSchema,
    }),

  updateSource: (id: string, values: Partial<IncomeSourceFormValues> & { effective_to?: string }) =>
    request({
      config: { method: "PUT", url: `income-sources/${id}`, data: values },
      schema: incomeSourceResSchema,
    }),

  newSourceVersion: (id: string, values: PayChangeFormValues) =>
    request({
      config: { method: "POST", url: `income-sources/${id}/versions`, data: values },
      schema: incomeSourceResSchema,
    }),

  deleteSource: (id: string) =>
    request({ config: { method: "DELETE", url: `income-sources/${id}` }, schema: resSchema }),

  accounts: () =>
    request({ config: { method: "GET", url: "accounts" }, schema: accountOptionsResSchema }),

  deductionTypes: () =>
    request({
      config: { method: "GET", url: "deduction-types" },
      schema: deductionTypeOptionsResSchema,
    }),

  payPeriods: (from: string, to: string) =>
    request({
      config: { method: "GET", url: "pay-periods", params: { from, to } },
      schema: payPeriodOptionsResSchema,
    }),
};
