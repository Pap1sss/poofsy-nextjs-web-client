import { request } from "@/lib/utils/request";

import {
  completeOnboardingResSchema,
  presetsResSchema,
  toOnboardingPayload,
  type OnboardingValues,
} from "./schema";

export const getPresets = () =>
  request({ config: { method: "GET", url: "onboarding/presets" }, schema: presetsResSchema });

export const completeOnboarding = (values: OnboardingValues) =>
  request({
    config: { method: "POST", url: "onboarding", data: toOnboardingPayload(values) },
    schema: completeOnboardingResSchema,
  });
