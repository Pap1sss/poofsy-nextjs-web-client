import { request } from "@/lib/utils/request";
import type { DateRange } from "@/components/shared/date-range-picker";

import type { ReportName } from "./constant";
import { reportResSchema, reportSchemas, type ReportData } from "./schema";

export const fetchReport = async <N extends ReportName>(
  name: N,
  range: DateRange
): Promise<ReportData<N>> => {
  const res = await request({
    config: { method: "GET", url: `reports/${name}`, params: { from: range.from, to: range.to } },
    schema: reportResSchema(reportSchemas[name]),
  });

  return res.data as ReportData<N>;
};
