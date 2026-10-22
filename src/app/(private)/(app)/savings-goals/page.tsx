import type { Metadata } from "next";

import GoalsPage from "@/features/savings-goal/components/GoalsPage";

export const metadata: Metadata = { title: "Savings goals" };

export default function Page() {
  return <GoalsPage />;
}
