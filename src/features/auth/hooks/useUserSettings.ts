"use client";

import { useAuthenticatedUser } from "../api/useAuthenticatedUser";

// Used until onboarding has saved the user's own choices.
const FALLBACK = {
  currency: "PHP",
  currency_minor_units: 2,
  locale: "en-PH",
  timezone: "Asia/Manila",
};

/** The signed-in user's money and date preferences, as saved at onboarding. */
export function useUserSettings() {
  const { data } = useAuthenticatedUser();
  const settings = data?.data?.settings;

  return {
    settings: settings ?? null,
    onboarded: data?.data?.onboarded ?? false,
    currency: settings?.currency ?? FALLBACK.currency,
    minorUnits: settings?.currency_minor_units ?? FALLBACK.currency_minor_units,
    locale: settings?.locale ?? FALLBACK.locale,
    timezone: settings?.timezone ?? FALLBACK.timezone,
  };
}
