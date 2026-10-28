"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { groupApi, toExpensePayload } from "./api";
import { groupLookupsQueryKey, groupQueryKey } from "./constant";
import type {
  GroupDetail,
  GroupFilters,
  GroupFormValues,
  GroupSettlementFormValues,
  ParticipantFormValues,
} from "./schema";

export const useGroups = (filters: GroupFilters) =>
  useQuery({
    queryKey: [groupQueryKey, "list", filters],
    queryFn: () => groupApi.list(filters),
    select: (res) => res.data,
    placeholderData: keepPreviousData,
  });

export const useGroup = (id: string) =>
  useQuery({
    queryKey: [groupQueryKey, "detail", id],
    queryFn: () => groupApi.show(id),
    select: (res) => res.data,
  });

/**
 * The server's split of the form as it stands, for the live breakdown. Errors (amounts that don't add up,
 * percentages off 100) come back as a 422 and are shown as feedback, never retried.
 */
export const useSplitPreview = (
  groupId: string,
  payload: ReturnType<typeof toExpensePayload> | null,
  expenseId?: string
) =>
  useQuery({
    queryKey: [groupQueryKey, "preview", groupId, expenseId ?? null, payload],
    queryFn: () => groupApi.preview(groupId, payload!, expenseId),
    enabled: payload !== null,
    select: (res) => res.data,
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useGroupAccounts = () =>
  useQuery({
    queryKey: [groupLookupsQueryKey, "accounts"],
    queryFn: groupApi.accounts,
    select: (res) => res.data,
  });

/** Spending categories only: a share recorded in the budget is an expense. */
export const useGroupCategories = () =>
  useQuery({
    queryKey: [groupLookupsQueryKey, "categories"],
    queryFn: groupApi.categories,
    select: (res) => res.data.filter((c) => c.kind === "spending"),
  });

export const useSavedPeople = () =>
  useQuery({
    queryKey: [groupLookupsQueryKey, "people"],
    queryFn: groupApi.people,
    select: (res) => res.data,
  });

/**
 * Every group write returns the whole group, which goes straight into its cache. Money can move with it
 * (a share recorded in the budget, a settlement into an account), so ledger figures refresh too.
 */
const useGroupMutation = <TVars, TRes extends { data?: GroupDetail }>(
  fn: (vars: TVars) => Promise<TRes>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: (res) => {
      if (res.data) queryClient.setQueryData([groupQueryKey, "detail", res.data.id], { ...res });
      [
        groupQueryKey,
        "transactions",
        "accounts",
        "budgets",
        "dashboard",
        "insights",
        "reports",
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });
};

export const useSaveGroup = () =>
  useGroupMutation(({ id, values }: { id?: string; values: GroupFormValues }) =>
    id ? groupApi.update(id, values) : groupApi.create(values)
  );

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confirmName }: { id: string; confirmName?: string }) =>
      groupApi.remove(id, confirmName),
    onSuccess: (_res, { id }) => {
      queryClient.removeQueries({ queryKey: [groupQueryKey, "detail", id] });
      [groupQueryKey, "transactions", "accounts", "budgets", "dashboard"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
    },
  });
};

export const useCompleteGroup = () =>
  useGroupMutation(({ id, complete }: { id: string; complete: boolean }) =>
    complete ? groupApi.complete(id) : groupApi.reopen(id)
  );

export const useAddParticipant = () =>
  useGroupMutation(
    ({ id, values }: { id: string; values: ParticipantFormValues | { is_me: true } }) =>
      groupApi.addParticipant(id, values)
  );

export const useUpdateParticipant = () =>
  useGroupMutation(
    ({
      id,
      participantId,
      values,
    }: {
      id: string;
      participantId: string;
      values: ParticipantFormValues;
    }) => groupApi.updateParticipant(id, participantId, values)
  );

export const useArchiveParticipant = () =>
  useGroupMutation(
    ({ id, participantId, archived }: { id: string; participantId: string; archived: boolean }) =>
      groupApi.archiveParticipant(id, participantId, archived)
  );

export const useRemoveParticipant = () =>
  useGroupMutation(({ id, participantId }: { id: string; participantId: string }) =>
    groupApi.removeParticipant(id, participantId)
  );

export const useSaveExpense = () =>
  useGroupMutation(
    ({
      id,
      payload,
      expenseId,
      idempotencyKey,
    }: {
      id: string;
      payload: ReturnType<typeof toExpensePayload>;
      expenseId: string | null;
      idempotencyKey: string;
    }) => groupApi.saveExpense(id, payload, expenseId, idempotencyKey)
  );

export const useRemoveExpense = () =>
  useGroupMutation(({ id, expenseId }: { id: string; expenseId: string }) =>
    groupApi.removeExpense(id, expenseId)
  );

export const useSettleGroup = () =>
  useGroupMutation(
    ({
      id,
      values,
      idempotencyKey,
    }: {
      id: string;
      values: GroupSettlementFormValues;
      idempotencyKey: string;
    }) => groupApi.settle(id, values, idempotencyKey)
  );

export const useCorrectGroupSettlement = () =>
  useGroupMutation(
    ({
      id,
      settlementId,
      values,
    }: {
      id: string;
      settlementId: string;
      values: GroupSettlementFormValues;
    }) => groupApi.correctSettlement(id, settlementId, values)
  );

export const useVoidGroupSettlement = () =>
  useGroupMutation(
    ({ id, settlementId, reason }: { id: string; settlementId: string; reason: string }) =>
      groupApi.voidSettlement(id, settlementId, reason)
  );
