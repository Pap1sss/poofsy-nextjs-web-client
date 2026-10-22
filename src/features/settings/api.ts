import { resSchema } from "@/lib/schemas";
import { request } from "@/lib/utils/request";
import { userSettingsSchema, type UserSettings } from "@/features/auth/schema/auth";

const settingsResSchema = resSchema.extend({ data: userSettingsSchema });

// Matches SettingsController::update(). Currency is never sent: it's fixed after setup (decision D3).
export type SettingsUpdate = Partial<
  Pick<
    UserSettings,
    | "timezone"
    | "locale"
    | "date_format"
    | "theme"
    | "rollover_default"
    | "rollover_overspending"
    | "approaching_limit_percent"
  >
>;

export const getSettings = () =>
  request({ config: { method: "GET", url: "settings" }, schema: settingsResSchema });

export const updateSettings = (data: SettingsUpdate) =>
  request({ config: { method: "PUT", url: "settings", data }, schema: settingsResSchema });

export const restoreDefaults = () =>
  request({ config: { method: "POST", url: "settings/restore-defaults" }, schema: resSchema });
