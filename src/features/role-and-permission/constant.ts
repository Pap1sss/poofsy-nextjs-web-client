export const queryKey = "roles";
export const baseUrl = "/roles";

export const rolePermissions = {
  ViewAny: "view any role",
  ViewRestrictedInfo: "view restricted role info",
  ViewSystemActivity: "view role system activity",
  Create: "create role",
  Update: "update role",
  ForceDelete: "force delete role",
} as const;

export const permissionPermissions = {
  ViewAny: "view any permission",
  ViewRestrictedInfo: "view restricted permission info",
  ViewSystemActivity: "view permission system activity",
} as const;
