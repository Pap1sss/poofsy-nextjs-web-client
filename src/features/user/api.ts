import { z } from "zod";

import { request } from "@/lib/utils/request";
import { downloadFile } from "@/lib/utils/download";
import { systemActivityListResSchema } from "@/features/system-activity";
import { optionResSchema, resSchema } from "@/lib/schemas";

import { baseUrl } from "./constant";
import {
  usersListResSchema,
  userListItemResSchema,
  UserFormSchema,
  ProfileFormSchema,
  UserEditFormSchema,
} from "./schema";

/** The signed-in user's own record. Unlike fetchUserById, it needs no admin permission. */
const fetchMine = () =>
  request({
    schema: userListItemResSchema,
    config: {
      url: `${baseUrl}/mine`,
      method: "get",
    },
  });

const fetchUserById = (id: string) =>
  request({
    schema: userListItemResSchema,
    config: {
      url: `${baseUrl}/${id}`,
      method: "get",
    },
  });

const fetchUsers = (params?: Record<string, unknown>) =>
  request({
    schema: usersListResSchema,
    config: {
      url: baseUrl,
      method: "get",
      params,
    },
  });

const createUser = (data: UserFormSchema) =>
  request({
    schema: resSchema,
    config: {
      url: baseUrl,
      method: "post",
      data,
    },
  });

/** `meta.password_changed` tells the client the session was terminated. */
const profileUpdateResSchema = resSchema.extend({
  meta: z.object({ password_changed: z.boolean() }).optional(),
});

const updateProfile = (data: Partial<ProfileFormSchema>, userId: string) =>
  request({
    schema: profileUpdateResSchema,
    config: {
      url: `${baseUrl}/${userId}/profile`,
      method: "patch",
      data,
    },
  });

const updateUser = (data: Partial<UserEditFormSchema>, userId: string) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${userId}`,
      method: "patch",
      data,
    },
  });

const deleteUserById = (userId: string) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${userId}`,
      method: "delete",
    },
  });

const fetchUserSystemActivitiesById = (userId: string) =>
  request({
    schema: systemActivityListResSchema,
    config: {
      url: `${baseUrl}/${userId}/system-activities`,
      method: "get",
    },
  });

const fetchUserOptions = (params?: Record<string, unknown>) =>
  request({
    schema: optionResSchema,
    config: {
      url: `${baseUrl}/options`,
      method: "get",
      params,
    },
  });

const restoreUserById = (userId: string) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${userId}/restore`,
      method: "patch",
    },
  });

/** Emails the user a reset link so no admin has to set a password by hand. */
const sendPasswordResetLink = (userId: string) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${userId}/password-reset-link`,
      method: "post",
    },
  });

/** Omit `ids` to export everything matching the current filters. */
const exportUsers = (ids?: string[]) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/export`,
      method: "get",
      params: ids?.length ? { ids } : undefined,
    },
  });

const bulkDeleteUsers = (ids: string[]) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/bulk/destroy`,
      method: "post",
      data: { ids },
    },
  });

const bulkRestoreUsers = (ids: string[]) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/bulk/restore`,
      method: "post",
      data: { ids },
    },
  });

const bulkForceDeleteUsers = (ids: string[]) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/bulk/force-destroy`,
      method: "post",
      data: { ids },
    },
  });

const bulkSyncUserRoles = (ids: string[], roles: string[], mode: "assign" | "remove") =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/bulk/roles`,
      method: "post",
      data: { ids, roles, mode },
    },
  });

export type UserStatusAction = "deactivate" | "reactivate";

const setUserStatus = (userId: string, action: UserStatusAction) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${userId}/${action}`,
      method: "patch",
    },
  });

const bulkSetUserStatus = (ids: string[], action: UserStatusAction) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/bulk/${action}`,
      method: "post",
      data: { ids },
    },
  });

const importUsers = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/import`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    },
  });
};

const downloadImportTemplate = () =>
  downloadFile(`${baseUrl}/import/template`, "user_import_template.xlsx");

export const userApiClient = {
  createUser,
  fetchMine,
  fetchUserById,
  fetchUsers,
  fetchUserOptions,
  fetchUserSystemActivitiesById,
  updateProfile,
  updateUser,
  deleteUserById,
  restoreUserById,
  sendPasswordResetLink,
  exportUsers,
  importUsers,
  downloadImportTemplate,
  bulkDeleteUsers,
  bulkRestoreUsers,
  bulkForceDeleteUsers,
  bulkSyncUserRoles,
  setUserStatus,
  bulkSetUserStatus,
};
