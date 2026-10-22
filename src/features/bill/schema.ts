import { z } from "zod";

import { moneySchema } from "@/lib/money";
import { resSchema } from "@/lib/schemas";

const optionSchema = z.object({ id: z.string(), name: z.string() });
const categoryRefSchema = optionSchema.extend({ color: z.string().nullable() });

export const OCCURRENCE_STATUSES = ["upcoming", "overdue", "paid", "skipped"] as const;
export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

// Matches App\Http\Resources\BillOccurrenceResource. `bill` is only present when the API loaded it.
export type BillOccurrence = z.infer<typeof billOccurrenceSchema>;
export const billOccurrenceSchema = z.object({
  id: z.string(),
  due_date: z.string(),
  amount: moneySchema,
  status: z.enum(OCCURRENCE_STATUSES),
  paid_at: z.string().nullable(),
  transaction_id: z.string().nullable(),
  bill: z
    .object({
      id: z.string(),
      name: z.string(),
      category: categoryRefSchema.nullable(),
      account: optionSchema.nullable(),
    })
    .optional(),
});

// Matches App\Http\Resources\BillResource.
export type Bill = z.infer<typeof billSchema>;
export const billSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: moneySchema,
  category: categoryRefSchema.nullable(),
  account: optionSchema.nullable(),
  recurrence: z.string(),
  start_date: z.string(),
  reminder_days_before: z.number(),
  notes: z.string().nullable(),
  active: z.boolean(),
  next_due: billOccurrenceSchema.nullable().optional(),
});

export const billListResSchema = resSchema.extend({ data: z.array(billSchema) });
export const billResSchema = resSchema.extend({ data: billSchema });
export const occurrenceListResSchema = resSchema.extend({ data: z.array(billOccurrenceSchema) });
export const occurrenceResSchema = resSchema.extend({ data: billOccurrenceSchema });
// Paying returns the new expense (TransactionResource); this page only needs its id and the message.
export const payResSchema = resSchema.extend({ data: z.object({ id: z.string() }) });

// Pickers (only the fields this feature reads).
export const accountOptionsResSchema = resSchema.extend({
  data: z.array(optionSchema.extend({ archived_at: z.string().nullable() })),
});
export const categoryOptionsResSchema = resSchema.extend({
  data: z.array(
    categoryRefSchema.extend({
      kind: z.enum(["spending", "savings", "investment"]),
      archived_at: z.string().nullable(),
    })
  ),
});
export const paymentMethodOptionsResSchema = resSchema.extend({
  data: z.array(optionSchema.extend({ archived_at: z.string().nullable() })),
});

// ------------------------------------------------------------------ repeat rule (RRULE)

export const REPEATS = ["weekly", "monthly", "every_2_months", "quarterly", "yearly"] as const;
export type Repeat = (typeof REPEATS)[number];

export const REPEAT_LABELS: Record<Repeat, string> = {
  weekly: "Every week",
  monthly: "Every month",
  every_2_months: "Every 2 months",
  quarterly: "Every 3 months",
  yearly: "Every year",
};

export const WEEKDAYS = [
  ["MO", "Monday"],
  ["TU", "Tuesday"],
  ["WE", "Wednesday"],
  ["TH", "Thursday"],
  ["FR", "Friday"],
  ["SA", "Saturday"],
  ["SU", "Sunday"],
] as const;
export type Weekday = (typeof WEEKDAYS)[number][0];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Days that exist in a month, for yearly bills (February stops at 28 so the bill never skips a year). */
export const daysInMonth = (month: number) =>
  [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

export type RepeatValues = {
  repeat: Repeat;
  weekday: Weekday;
  /** "1".."31"; "31" means the last day of the month (BYMONTHDAY=-1). */
  month_day: string;
  /** "1".."12", yearly only. */
  month: string;
};

const INTERVALS: Partial<Record<Repeat, number>> = { every_2_months: 2, quarterly: 3 };

/** Builds the RRULE the API accepts (BillRequest: weekly, monthly or yearly). */
export function toRRule({ repeat, weekday, month_day, month }: RepeatValues): string {
  const day = month_day === "31" ? "-1" : month_day;

  switch (repeat) {
    case "weekly":
      return `FREQ=WEEKLY;BYDAY=${weekday}`;
    case "yearly":
      return `FREQ=YEARLY;BYMONTH=${month};BYMONTHDAY=${month_day}`;
    default: {
      const interval = INTERVALS[repeat];
      return `FREQ=MONTHLY${interval ? `;INTERVAL=${interval}` : ""};BYMONTHDAY=${day}`;
    }
  }
}

/** Reads a stored RRULE back into the builder; null when it isn't one the builder can make. */
export function parseRRule(rule: string): RepeatValues | null {
  const parts = Object.fromEntries(
    rule
      .replace(/^RRULE:/, "")
      .split(";")
      .map((part) => part.split("=") as [string, string])
  );
  const base: RepeatValues = { repeat: "monthly", weekday: "MO", month_day: "1", month: "1" };
  const known = new Set(["FREQ", "BYDAY", "BYMONTHDAY", "BYMONTH", "INTERVAL"]);

  if (Object.keys(parts).some((key) => !known.has(key))) return null;

  if (
    parts.FREQ === "WEEKLY" &&
    WEEKDAYS.some(([code]) => code === parts.BYDAY) &&
    !parts.INTERVAL
  ) {
    return { ...base, repeat: "weekly", weekday: parts.BYDAY as Weekday };
  }

  const day = parts.BYMONTHDAY === "-1" ? "31" : parts.BYMONTHDAY;
  if (!day || !/^([1-9]|[12]\d|3[01])$/.test(day)) return null;

  if (parts.FREQ === "MONTHLY" && !parts.BYDAY && !parts.BYMONTH) {
    const repeat = (
      { "": "monthly", "1": "monthly", "2": "every_2_months", "3": "quarterly" } as Record<
        string,
        Repeat
      >
    )[parts.INTERVAL ?? ""];
    return repeat ? { ...base, repeat, month_day: day } : null;
  }

  if (parts.FREQ === "YEARLY" && /^([1-9]|1[0-2])$/.test(parts.BYMONTH ?? "") && !parts.INTERVAL) {
    return { ...base, repeat: "yearly", month: parts.BYMONTH, month_day: day };
  }

  return null;
}

const ordinal = (day: number) => {
  const suffix =
    day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th");
  return `${day}${suffix}`;
};

/** "Every month on the 25th", "Every 3 months on the last day", "Every week on Monday". */
export function describeRRule(rule: string): string {
  const parsed = parseRRule(rule);
  if (!parsed) return `Custom schedule (${rule})`;

  const day =
    parsed.month_day === "31" ? "the last day" : `the ${ordinal(Number(parsed.month_day))}`;

  switch (parsed.repeat) {
    case "weekly":
      return `Every week on ${WEEKDAYS.find(([code]) => code === parsed.weekday)?.[1]}`;
    case "yearly":
      return `Every year on ${MONTHS[Number(parsed.month) - 1]} ${parsed.month_day}`;
    default:
      return `${REPEAT_LABELS[parsed.repeat]} on ${day}`;
  }
}

// ------------------------------------------------------------------ forms

// Mirrors App\Http\Requests\Bill\BillRequest; the repeat fields become `recurrence`.
export type BillFormValues = z.infer<typeof BillFormSchema>;
export const BillFormSchema = z.object({
  name: z.string().trim().min(1, "Give the bill a name.").max(100),
  amount: z.string().regex(/[1-9]/, "Enter the usual amount."),
  category_id: z.string(),
  account_id: z.string(),
  /** Set when an existing rule doesn't fit the builder; it's then sent unchanged. */
  custom_rule: z.string(),
  repeat: z.enum(REPEATS),
  weekday: z.enum(WEEKDAYS.map(([code]) => code) as [Weekday, ...Weekday[]]),
  month_day: z.string(),
  month: z.string(),
  start_date: z.string().min(1, "Pick the date it starts from."),
  reminder_days_before: z
    .string()
    .regex(/^\d+$/, "Enter a number of days.")
    .refine((v) => Number(v) <= 30, "Up to 30 days before."),
  notes: z.string().max(2000),
  active: z.boolean(),
});

export type PayFormValues = z.infer<typeof PayFormSchema>;
export const PayFormSchema = z.object({
  account_id: z.string().min(1, "Choose the account this bill is paid from."),
  amount: z.string().regex(/[1-9]/, "Enter the amount paid."),
  paid_on: z.string().min(1, "Pick the date you paid."),
  payment_method_id: z.string(),
});
