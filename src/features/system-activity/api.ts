import { request } from "@/lib/utils/request";

import { baseUrl } from "./constant";
import { systemActivityListPaginatedResSchema } from "./schema";

const fetchSystemActivityList = (params?: Record<string, unknown>) =>
  request({
    schema: systemActivityListPaginatedResSchema,
    config: {
      url: `${baseUrl}/list`,
      method: "get",
      params,
    },
  });

const fetchSystemActivityListByCauser = (causerId: string) =>
  request({
    schema: systemActivityListPaginatedResSchema,
    config: {
      url: `${baseUrl}/causers/${causerId}`,
      method: "get",
    },
  });

const fetchSystemActivityListBySubject = (subjectId: string) =>
  request({
    schema: systemActivityListPaginatedResSchema,
    config: {
      url: `${baseUrl}/subjects/${subjectId}`,
      method: "get",
    },
  });

export const activityApiClient = {
  fetchSystemActivityList,
  fetchSystemActivityListByCauser,
  fetchSystemActivityListBySubject,
};
