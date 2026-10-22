import { request } from "@/lib/utils/request";

import { calendarResSchema } from "./schema";

/** GET /calendar?month=YYYY-MM: every day of the month with paydays, bills and that day's totals. */
export const fetchCalendar = (month: string) =>
  request({
    config: { method: "GET", url: "calendar", params: { month } },
    schema: calendarResSchema,
  });
