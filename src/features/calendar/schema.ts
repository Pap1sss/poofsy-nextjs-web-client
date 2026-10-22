import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

// Matches App\Http\Resources\BillOccurrenceResource. Stored "pending" is split into upcoming/overdue by the API.
export const BILL_STATUSES = ["upcoming", "overdue", "paid", "skipped"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export type CalendarBill = z.infer<typeof calendarBillSchema>;
export const calendarBillSchema = z.object({
  id: z.string(),
  due_date: z.string(),
  amount: moneySchema,
  status: z.enum(BILL_STATUSES),
  paid_at: z.string().nullable(),
  transaction_id: z.string().nullable(),
  bill: z
    .object({
      id: z.string(),
      name: z.string(),
      category: z
        .object({ id: z.string(), name: z.string(), color: z.string().nullable() })
        .nullable(),
      account: z.object({ id: z.string(), name: z.string() }).nullable(),
    })
    .optional(),
});

// Matches App\Services\CalendarService::month().
export type CalendarDay = z.infer<typeof calendarDaySchema>;
export const calendarDaySchema = z.object({
  date: z.string(),
  paydays: z.array(z.object({ pay_period_id: z.string(), label: z.string() })),
  bills: z.array(calendarBillSchema),
  income: moneySchema,
  spent: moneySchema,
  transactions_count: z.number(),
});

export type CalendarMonth = z.infer<typeof calendarMonthSchema>;
export const calendarMonthSchema = z.object({
  month: z.string(),
  days: z.array(calendarDaySchema),
});

export const calendarResSchema = resSchema.extend({ data: calendarMonthSchema });
