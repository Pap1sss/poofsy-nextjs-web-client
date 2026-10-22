import { request } from "@/lib/utils/request";
import { resSchema, optionResSchema } from "@/lib/schemas";

import { baseUrl } from "./constant";
import {
  permissionsByCategoryResSchema,
  RoleCreateSchema,
  RoleEditSchema,
  roleResSchema,
  rolePermissionsResSchema,
  rolesPaginatedResSchema,
  roleNamesResSchema,
} from "./schema";
import { systemActivityListResSchema } from "../system-activity";

const fetchRoleById = (roleId: string) =>
  request({
    schema: roleResSchema,
    config: {
      url: `${baseUrl}/${roleId}`,
      method: "get",
    },
  });

const fetchRoles = (params?: Record<string, unknown>) =>
  request({
    schema: rolesPaginatedResSchema,
    config: {
      url: `${baseUrl}/list`,
      method: "get",
      params,
    },
  });

const fetchRoleNames = () =>
  request({
    schema: roleNamesResSchema,
    config: {
      url: `${baseUrl}/names`,
      method: "get",
    },
  });

const fetchRoleOptions = (params?: Record<string, unknown>) =>
  request({
    schema: optionResSchema,
    config: {
      url: `${baseUrl}/options`,
      method: "get",
      params,
    },
  });

const createRole = (data: RoleCreateSchema) =>
  request({
    schema: resSchema,
    config: {
      url: baseUrl,
      method: "post",
      data,
    },
  });

const updateRoleById = (data: RoleEditSchema, roleId: string) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${roleId}`,
      method: "patch",
      data,
    },
  });

const deleteRoleById = (roleId: string) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/${roleId}`,
      method: "delete",
    },
  });

const bulkDeleteRoles = (ids: string[]) =>
  request({
    schema: resSchema,
    config: {
      url: `${baseUrl}/bulk/destroy`,
      method: "post",
      data: { ids },
    },
  });

const fetchPermissionsByCategory = () =>
  request({
    schema: permissionsByCategoryResSchema,
    config: {
      url: "/permissions/by-category",
      method: "get",
    },
  });

const fetchRoleWithPermissionsById = (roleId: string) =>
  request({
    schema: rolePermissionsResSchema,
    config: {
      url: `${baseUrl}/${roleId}/permissions`,
      method: "get",
    },
  });

const fetchRoleSystemActivitiesById = (roleId: string) =>
  request({
    schema: systemActivityListResSchema,
    config: {
      url: `${baseUrl}/${roleId}/system-activities`,
      method: "get",
    },
  });

export const roleApiClient = {
  fetchRoleById,
  fetchRoles,
  fetchRoleNames,
  fetchRoleOptions,
  createRole,
  updateRoleById,
  deleteRoleById,
  bulkDeleteRoles,
  fetchPermissionsByCategory,
  fetchRoleWithPermissionsById,
  fetchRoleSystemActivitiesById,
};
