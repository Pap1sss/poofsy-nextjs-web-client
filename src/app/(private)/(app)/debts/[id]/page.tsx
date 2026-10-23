import type { Metadata } from "next";

import { DebtDetailPage } from "@/features/debt/components/DebtDetailPage";

export const metadata: Metadata = { title: "Debt" };

export default async function DebtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="page-container">
      <DebtDetailPage debtId={id} />
    </div>
  );
}
