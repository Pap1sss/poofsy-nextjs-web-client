import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

import { CHARGE_ALLOCATIONS, CHARGE_KINDS, GROUP_STATUSES, SPLIT_METHODS } from "./constant";

export type SplitMethod = (typeof SPLIT_METHODS)[number];
export type ChargeKind = (typeof CHARGE_KINDS)[number];
export type ChargeAllocation = (typeof CHARGE_ALLOCATIONS)[number];
export type GroupStatus = (typeof GROUP_STATUSES)[number];

const optionSchema = z.object({ id: z.string(), name: z.string() });
const splitValueSchema = z.object({ participant_id: z.string(), value: z.string().nullable() });

// Matches GroupService::card().
export type GroupCard = z.infer<typeof groupCardSchema>;
export const groupCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  currency: z.string(),
  started_on: z.string(),
  status: z.enum(GROUP_STATUSES),
  completed_at: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  participants_count: z.number(),
  expenses_count: z.number(),
  total_expenses: moneySchema,
  // Null when the signed-in user isn't a participant.
  my_paid: moneySchema.nullable(),
  my_share: moneySchema.nullable(),
  i_owe: moneySchema.nullable(),
  owed_to_me: moneySchema.nullable(),
  // Null when nothing ever needed settling.
  progress_percent: z.number().nullable(),
  is_settled: z.boolean(),
  last_activity_at: z.string().nullable(),
});

export type Participant = z.infer<typeof participantSchema>;
export const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_me: z.boolean(),
  person_id: z.string().nullable(),
  archived_at: z.string().nullable(),
  paid: moneySchema,
  share: moneySchema,
  settled_sent: moneySchema,
  settled_received: moneySchema,
  // Positive: should get money back. Negative: owes.
  net: moneySchema,
  standing: z.enum(["owed", "owes", "settled"]),
  // Part of an expense or settlement: can be archived, not removed.
  in_use: z.boolean(),
});

export type Allocation = z.infer<typeof allocationSchema>;
export const allocationSchema = z.object({
  participant_id: z.string(),
  base: moneySchema,
  charges: moneySchema,
  discounts: moneySchema,
  total: moneySchema,
});

// Matches GroupExpenseService::present().
export type GroupExpense = z.infer<typeof groupExpenseSchema>;
export const groupExpenseSchema = z.object({
  id: z.string(),
  description: z.string(),
  expense_date: z.string(),
  notes: z.string().nullable(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string().nullable() }).nullable(),
  split_method: z.enum(SPLIT_METHODS),
  subtotal: moneySchema,
  total_amount: moneySchema,
  payers: z.array(z.object({ participant_id: z.string(), amount: moneySchema })),
  allocations: z.array(allocationSchema),
  splits: z.array(splitValueSchema),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      unit_price: moneySchema,
      quantity: z.string(),
      line_total: moneySchema,
      participant_ids: z.array(z.string()),
    })
  ),
  charges: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(CHARGE_KINDS),
      label: z.string().nullable(),
      amount: moneySchema,
      allocation: z.enum(CHARGE_ALLOCATIONS),
      splits: z.array(splitValueSchema),
    })
  ),
  record_share: z.boolean(),
  share_account: optionSchema.nullable(),
  share_transaction_id: z.string().nullable(),
  advance_transaction_id: z.string().nullable(),
  my_paid: moneySchema.nullable(),
  my_share: moneySchema.nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type GroupSettlement = z.infer<typeof groupSettlementSchema>;
export const groupSettlementSchema = z.object({
  id: z.string(),
  from: optionSchema,
  to: optionSchema,
  amount: moneySchema,
  settlement_date: z.string(),
  reference_number: z.string().nullable(),
  notes: z.string().nullable(),
  record_as: z.enum(["none", "balance", "cash_flow"]),
  account: optionSchema.nullable(),
  transaction_id: z.string().nullable(),
  voided_at: z.string().nullable(),
  void_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;
export const suggestionSchema = z.object({
  from: optionSchema,
  to: optionSchema,
  amount: moneySchema,
});

// Matches GroupService::present(): every write returns the whole group.
export type GroupDetail = z.infer<typeof groupDetailSchema>;
export const groupDetailSchema = groupCardSchema.extend({
  participants: z.array(participantSchema),
  outstanding: moneySchema,
  to_settle_initially: moneySchema,
  suggestions: z.array(suggestionSchema),
  expenses: z.array(groupExpenseSchema),
  settlements: z.array(groupSettlementSchema),
});

export type GroupSummary = z.infer<typeof groupSummarySchema>;
export const groupSummarySchema = z.object({
  active_count: z.number(),
  completed_count: z.number(),
  owed_to_me: moneySchema,
  i_owe: moneySchema,
});

export const groupListResSchema = resSchema.extend({
  data: z.object({ summary: groupSummarySchema, groups: z.array(groupCardSchema) }),
});
export const groupResSchema = resSchema.extend({ data: groupDetailSchema });

export type SplitPreview = z.infer<typeof splitPreviewSchema>;
export const splitPreviewSchema = z.object({
  subtotal: moneySchema,
  total: moneySchema,
  line_totals: z.array(moneySchema),
  allocations: z.array(allocationSchema),
});
export const splitPreviewResSchema = resSchema.extend({ data: splitPreviewSchema });

// Pickers (only the fields this feature reads).
export const optionsResSchema = resSchema.extend({ data: z.array(optionSchema) });
export const categoryOptionsResSchema = resSchema.extend({
  data: z.array(
    optionSchema.extend({
      kind: z.enum(["spending", "savings", "investment"]),
      color: z.string().nullable(),
    })
  ),
});

export type GroupFilters = { search: string; status: GroupStatus | "all" };

// Mirrors App\Http\Requests\Group\GroupRequest.
export type GroupFormValues = z.infer<typeof GroupFormSchema>;
export const GroupFormSchema = z.object({
  name: z.string().trim().min(1, "Give the group a name.").max(100),
  description: z.string().max(1000),
  color: z.string(),
  icon: z.string(),
  started_on: z.string().min(1, "Pick a date."),
  include_me: z.boolean(),
  participants: z.array(z.object({ name: z.string().max(100) })),
});

// Mirrors App\Http\Requests\Group\ParticipantRequest.
export type ParticipantFormValues = z.infer<typeof ParticipantFormSchema>;
export const ParticipantFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(100),
  person_id: z.string(),
});

/** Per-participant input on a split: ticked or not, plus a value for amount/shares/percent/quantity. */
export type PartInput = { included: boolean; value: string };

// The expense form keeps per-participant inputs keyed by participant id; api.ts turns them into the API shape.
// Sums (amounts vs subtotal, percent vs 100, payers vs total) are checked by the API's splitting engine.
export type ExpenseFormValues = {
  description: string;
  expense_date: string;
  category_id: string;
  notes: string;
  split_method: SplitMethod;
  subtotal: string;
  parts: Record<string, PartInput>;
  items: { name: string; unit_price: string; quantity: string; participant_ids: string[] }[];
  charges: {
    kind: ChargeKind;
    label: string;
    amount: string;
    allocation: ChargeAllocation;
    parts: Record<string, PartInput>;
  }[];
  payer_mode: "single" | "multiple";
  payer_id: string;
  payer_amounts: Record<string, string>;
  record_share: boolean;
  share_account_id: string;
};

// Mirrors App\Http\Requests\Group\GroupSettlementRequest.
export type GroupSettlementFormValues = z.infer<typeof GroupSettlementFormSchema>;
export const GroupSettlementFormSchema = z
  .object({
    from_participant_id: z.string().min(1, "Choose who paid."),
    to_participant_id: z.string().min(1, "Choose who received it."),
    amount: z.string().regex(/[1-9]/, "Enter an amount."),
    settlement_date: z.string().min(1, "Pick a date."),
    reference_number: z.string().max(100),
    notes: z.string().max(2000),
    record_as: z.enum(["none", "balance"]),
    account_id: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.from_participant_id && values.from_participant_id === values.to_participant_id) {
      ctx.addIssue({
        code: "custom",
        path: ["to_participant_id"],
        message: "Someone can't pay themselves.",
      });
    }
    if (values.record_as === "balance" && !values.account_id) {
      ctx.addIssue({
        code: "custom",
        path: ["account_id"],
        message: "Choose the account the money moved in or out of.",
      });
    }
  });
