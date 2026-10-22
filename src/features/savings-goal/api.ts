import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  accountOptionsResSchema,
  categoryOptionsResSchema,
  goalListResSchema,
  goalResSchema,
  type ContributionFormValues,
  type GoalFormValues,
} from "./schema";

export type GoalStatus = "active" | "archived";

const blankToNull = (value: string) => (value.trim() === "" ? null : value);

const toPayload = (values: GoalFormValues) => ({
  name: values.name.trim(),
  // The column can't be null: an emergency fund without a typed target simply omits it.
  ...(values.target_amount.trim() !== "" ? { target_amount: values.target_amount } : {}),
  target_date: blankToNull(values.target_date),
  account_id: blankToNull(values.account_id),
  is_emergency_fund: values.is_emergency_fund,
  emergency_months: values.is_emergency_fund ? Number(values.emergency_months) : null,
});

const toContribution = (values: ContributionFormValues) => ({
  type: values.type,
  amount: values.amount,
  date: values.date,
  notes: blankToNull(values.notes),
  from_account_id: values.move_money ? blankToNull(values.from_account_id) : null,
  category_id:
    values.move_money && values.type === "contribution" ? blankToNull(values.category_id) : null,
});

export const savingsGoalApi = {
  list: (status: GoalStatus) =>
    request({
      config: { method: "GET", url: "savings-goals", params: { status } },
      schema: goalListResSchema,
    }),

  create: (values: GoalFormValues) =>
    request({
      config: { method: "POST", url: "savings-goals", data: toPayload(values) },
      schema: goalResSchema,
    }),

  update: (id: string, values: GoalFormValues) =>
    request({
      config: { method: "PUT", url: `savings-goals/${id}`, data: toPayload(values) },
      schema: goalResSchema,
    }),

  remove: (id: string) =>
    request({ config: { method: "DELETE", url: `savings-goals/${id}` }, schema: resSchema }),

  archive: (id: string) =>
    request({
      config: { method: "POST", url: `savings-goals/${id}/archive` },
      schema: goalResSchema,
    }),

  restore: (id: string) =>
    request({
      config: { method: "POST", url: `savings-goals/${id}/restore` },
      schema: goalResSchema,
    }),

  contribute: (id: string, values: ContributionFormValues) =>
    request({
      config: {
        method: "POST",
        url: `savings-goals/${id}/contributions`,
        data: toContribution(values),
      },
      schema: goalResSchema,
    }),

  removeContribution: (goalId: string, contributionId: string) =>
    request({
      config: { method: "DELETE", url: `savings-goals/${goalId}/contributions/${contributionId}` },
      schema: goalResSchema,
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
};
