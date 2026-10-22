import type { Metadata } from "next";

import { BudgetDetailPage } from "@/features/budget/components/budget-detail-page";

export const metadata: Metadata = { title: "Budget" };

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="page-container">
      <BudgetDetailPage budgetId={id} />
    </div>
  );
}
