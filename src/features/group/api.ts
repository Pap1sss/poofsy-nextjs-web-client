import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";

import {
  categoryOptionsResSchema,
  groupListResSchema,
  groupResSchema,
  optionsResSchema,
  splitPreviewResSchema,
  type ExpenseFormValues,
  type GroupFilters,
  type GroupFormValues,
  type GroupSettlementFormValues,
  type ParticipantFormValues,
  type PartInput,
} from "./schema";

const blankToNull = (value: string | undefined) => (value?.trim() ? value.trim() : null);

/** Ticked participants, in group order, as the API's split rows. */
const toSplits = (parts: Record<string, PartInput>, order: string[], withValue: boolean) =>
  order
    .filter((id) => parts[id]?.included)
    .map((id) => ({ participant_id: id, value: withValue ? parts[id].value || null : null }));

/**
 * The API shape of the expense form. `order` is the group's participant order; `total` is the expense total
 * from the server's preview, used as the single payer's amount (the client never adds figures up, D5).
 */
export const toExpensePayload = (values: ExpenseFormValues, order: string[], total?: string) => {
  const items = values.split_method === "items";

  return {
    description: values.description.trim(),
    expense_date: values.expense_date,
    category_id: blankToNull(values.category_id),
    notes: blankToNull(values.notes),
    split_method: values.split_method,
    ...(items
      ? {
          items: values.items.map((item) => ({
            name: item.name.trim(),
            unit_price: item.unit_price || "0",
            quantity: item.quantity,
            participant_ids: order.filter((id) => item.participant_ids.includes(id)),
          })),
        }
      : {
          subtotal: values.subtotal,
          splits: toSplits(values.parts, order, values.split_method !== "equal"),
        }),
    charges: values.charges.map((charge) => ({
      kind: charge.kind,
      label: blankToNull(charge.label),
      amount: charge.amount,
      allocation: charge.allocation,
      splits: ["amount", "shares", "assigned"].includes(charge.allocation)
        ? toSplits(charge.parts, order, charge.allocation !== "assigned")
        : [],
    })),
    payers:
      values.payer_mode === "single"
        ? values.payer_id && total
          ? [{ participant_id: values.payer_id, amount: total }]
          : []
        : order
            .filter((id) => /[1-9]/.test(values.payer_amounts[id] ?? ""))
            .map((id) => ({ participant_id: id, amount: values.payer_amounts[id] })),
    record_share: values.record_share,
    share_account_id: values.record_share ? blankToNull(values.share_account_id) : null,
  };
};

const toSettlementPayload = (values: GroupSettlementFormValues, creating: boolean) => ({
  amount: values.amount,
  settlement_date: values.settlement_date,
  reference_number: blankToNull(values.reference_number),
  notes: blankToNull(values.notes),
  ...(creating
    ? {
        from_participant_id: values.from_participant_id,
        to_participant_id: values.to_participant_id,
        record_as: values.record_as,
        account_id: values.record_as === "balance" ? blankToNull(values.account_id) : null,
      }
    : {}),
});

const group = (id: string, path = "") => `groups/${id}${path}`;

export const groupApi = {
  list: (filters: GroupFilters) =>
    request({
      config: {
        method: "GET",
        url: "groups",
        params: {
          ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
          ...(filters.status !== "all" ? { status: filters.status } : {}),
        },
      },
      schema: groupListResSchema,
    }),

  show: (id: string) =>
    request({ config: { method: "GET", url: group(id) }, schema: groupResSchema }),

  create: (values: GroupFormValues) =>
    request({
      config: {
        method: "POST",
        url: "groups",
        data: {
          name: values.name.trim(),
          description: blankToNull(values.description),
          color: blankToNull(values.color),
          icon: blankToNull(values.icon),
          started_on: values.started_on,
          include_me: values.include_me,
          participants: values.participants
            .filter((p) => p.name.trim())
            .map((p) => ({ name: p.name.trim() })),
        },
      },
      schema: groupResSchema,
    }),

  update: (id: string, values: GroupFormValues) =>
    request({
      config: {
        method: "PUT",
        url: group(id),
        data: {
          name: values.name.trim(),
          description: blankToNull(values.description),
          color: blankToNull(values.color),
          icon: blankToNull(values.icon),
          started_on: values.started_on,
        },
      },
      schema: groupResSchema,
    }),

  remove: (id: string, confirmName?: string) =>
    request({
      config: {
        method: "DELETE",
        url: group(id),
        data: confirmName ? { confirm_name: confirmName } : {},
      },
      schema: resSchema,
    }),

  complete: (id: string) =>
    request({ config: { method: "POST", url: group(id, "/complete") }, schema: groupResSchema }),

  reopen: (id: string) =>
    request({ config: { method: "POST", url: group(id, "/reopen") }, schema: groupResSchema }),

  addParticipant: (id: string, values: ParticipantFormValues | { is_me: true }) =>
    request({
      config: {
        method: "POST",
        url: group(id, "/participants"),
        data:
          "is_me" in values
            ? values
            : { name: values.name.trim(), person_id: blankToNull(values.person_id) },
      },
      schema: groupResSchema,
    }),

  updateParticipant: (id: string, participantId: string, values: ParticipantFormValues) =>
    request({
      config: {
        method: "PUT",
        url: group(id, `/participants/${participantId}`),
        data: { name: values.name.trim(), person_id: blankToNull(values.person_id) },
      },
      schema: groupResSchema,
    }),

  archiveParticipant: (id: string, participantId: string, archived: boolean) =>
    request({
      config: {
        method: "POST",
        url: group(id, `/participants/${participantId}/${archived ? "archive" : "restore"}`),
      },
      schema: groupResSchema,
    }),

  removeParticipant: (id: string, participantId: string) =>
    request({
      config: { method: "DELETE", url: group(id, `/participants/${participantId}`) },
      schema: groupResSchema,
    }),

  preview: (id: string, payload: ReturnType<typeof toExpensePayload>, expenseId?: string) =>
    request({
      config: {
        method: "POST",
        url: group(id, expenseId ? `/expenses/${expenseId}/preview` : "/expenses/preview"),
        data: payload,
      },
      schema: splitPreviewResSchema,
    }),

  saveExpense: (
    id: string,
    payload: ReturnType<typeof toExpensePayload>,
    expenseId: string | null,
    idempotencyKey: string
  ) =>
    request({
      config: expenseId
        ? { method: "PUT", url: group(id, `/expenses/${expenseId}`), data: payload }
        : {
            method: "POST",
            url: group(id, "/expenses"),
            data: payload,
            headers: { "Idempotency-Key": idempotencyKey },
          },
      schema: groupResSchema,
    }),

  removeExpense: (id: string, expenseId: string) =>
    request({
      config: { method: "DELETE", url: group(id, `/expenses/${expenseId}`) },
      schema: groupResSchema,
    }),

  settle: (id: string, values: GroupSettlementFormValues, idempotencyKey: string) =>
    request({
      config: {
        method: "POST",
        url: group(id, "/settlements"),
        data: toSettlementPayload(values, true),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      schema: groupResSchema,
    }),

  correctSettlement: (id: string, settlementId: string, values: GroupSettlementFormValues) =>
    request({
      config: {
        method: "PUT",
        url: group(id, `/settlements/${settlementId}`),
        data: toSettlementPayload(values, false),
      },
      schema: groupResSchema,
    }),

  voidSettlement: (id: string, settlementId: string, reason: string) =>
    request({
      config: {
        method: "POST",
        url: group(id, `/settlements/${settlementId}/void`),
        data: { reason: reason.trim() },
      },
      schema: groupResSchema,
    }),

  accounts: () =>
    request({
      config: { method: "GET", url: "accounts", params: { status: "active" } },
      schema: optionsResSchema,
    }),

  categories: () =>
    request({
      config: { method: "GET", url: "categories", params: { status: "active" } },
      schema: categoryOptionsResSchema,
    }),

  people: () => request({ config: { method: "GET", url: "people" }, schema: optionsResSchema }),
};
