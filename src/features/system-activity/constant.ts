export const queryKey = "system-activities";
export const baseUrl = "/system-activities";

export const systemActivityPermissions = {
  ViewOwn: "view own system activity",
  ViewAny: "view any system activity",
  ViewRestrictedInfo: "view restricted system activity info",
} as const;
