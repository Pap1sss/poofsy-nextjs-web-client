import type { Metadata } from "next";

import { PaydayPlanner } from "@/features/budget/components/payday-planner";

export const metadata: Metadata = { title: "Payday Planner" };

export default function BudgetsPage() {
  return (
    <div className="page-container">
      <PaydayPlanner />
    </div>
  );
}
