import type { Metadata } from "next";

import OnboardingWizard from "@/features/onboarding/components/OnboardingWizard";

export const metadata: Metadata = {
  title: "Set up your budget",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
