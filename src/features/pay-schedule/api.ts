import { request } from "@/lib/utils/request";

import {
  payScheduleListResSchema,
  payScheduleResSchema,
  paydayPreviewResSchema,
  toPaySchedulePayload,
  type PayScheduleFormValues,
} from "./schema";

export const payScheduleApi = {
  list: () =>
    request({ config: { method: "GET", url: "pay-schedules" }, schema: payScheduleListResSchema }),

  /** The next six paydays these settings would produce; nothing is saved. */
  preview: (values: PayScheduleFormValues) =>
    request({
      config: { method: "POST", url: "pay-schedules/preview", data: toPaySchedulePayload(values) },
      schema: paydayPreviewResSchema,
    }),

  change: (values: PayScheduleFormValues) =>
    request({
      config: { method: "POST", url: "pay-schedules", data: toPaySchedulePayload(values) },
      schema: payScheduleResSchema,
    }),
};
