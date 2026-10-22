/** Permission names, matching the API's app/Enums/Permissions/UserPermissionEnum. */
export const userPermissions = {
  ViewAny: "view any user",
  ViewRestrictedInfo: "view restricted user info",
  ViewSystemActivity: "view user system activity",
  Create: "create user",
  Update: "update user",
  Delete: "delete user",
  ForceDelete: "force delete user",
  Restore: "restore user",
  Deactivate: "deactivate user",
  Import: "import user",
  Export: "export user",
  ResetPassword: "reset user password",
} as const;
