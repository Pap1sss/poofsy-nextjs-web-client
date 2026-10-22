import { request } from "@/lib/utils/request";

import { currentPeriodResSchema, dashboardResSchema, insightsResSchema } from "./schema";

/** No range = the current cutoff, chosen by the API in the user's time zone. */
export const getDashboard = (range: { from: string; to: string } | null) =>
  request({
    config: { method: "GET", url: "dashboard", params: range ?? undefined },
    schema: dashboardResSchema,
  });

export const getInsights = () =>
  request({ config: { method: "GET", url: "insights" }, schema: insightsResSchema });

export const getCurrentPeriod = () =>
  request({
    config: { method: "GET", url: "pay-periods/current" },
    schema: currentPeriodResSchema,
  });
