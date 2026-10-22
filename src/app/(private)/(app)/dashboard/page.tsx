"use client";

import { PageHeader } from "@/components/shared/page-header";
import { useAuth, useUserSettings } from "@/features/auth";
import { DashboardCards } from "@/features/dashboard";
import { BudgetDashboard } from "@/features/home";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: auth } = useAuth();
  const { onboarded } = useUserSettings();
  const firstName = auth?.data?.name?.trim().split(/\s+/)[0];
  const title = firstName ? `${greeting()}, ${firstName}` : "Dashboard";

  // Budgeting users get the money dashboard; anyone who skipped onboarding (super-admins) keeps the module cards.
  if (onboarded) return <BudgetDashboard greeting={title} />;

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title={title}
        sprite="mascot"
        description="Jump into any module you have access to."
      />

      <DashboardCards />
    </div>
  );
}
