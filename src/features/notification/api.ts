import { request } from "@/lib/utils/request";
import { resSchema } from "@/lib/schemas";

import { baseUrl } from "./constant";
import { notificationListResSchema, notificationOverviewResSchema } from "./schema";

const fetchNotificationList = (params?: Record<string, unknown>) =>
  request({
    schema: notificationListResSchema,
    config: { url: baseUrl, method: "get", params },
  });

const fetchNotificationOverview = () =>
  request({
    schema: notificationOverviewResSchema,
    config: { url: `${baseUrl}/overview`, method: "get" },
  });

const readNotificationById = (notificationId: string) =>
  request({
    schema: resSchema,
    config: { url: `${baseUrl}/${notificationId}`, method: "post" },
  });

const readAllNotifications = () =>
  request({
    schema: resSchema,
    config: { url: `${baseUrl}/read-all`, method: "post" },
  });

const deleteNotificationById = (notificationId: string) =>
  request({
    schema: resSchema,
    config: { url: `${baseUrl}/${notificationId}`, method: "delete" },
  });

const deleteAllNotifications = () =>
  request({
    schema: resSchema,
    config: { url: baseUrl, method: "delete" },
  });

export const notificationApiClient = {
  fetchNotificationList,
  fetchNotificationOverview,
  readNotificationById,
  readAllNotifications,
  deleteNotificationById,
  deleteAllNotifications,
};
