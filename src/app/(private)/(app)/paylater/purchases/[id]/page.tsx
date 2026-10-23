import type { Metadata } from "next";

import { PurchaseDetailPage } from "@/features/paylater/components/PurchaseDetailPage";

export const metadata: Metadata = { title: "PayLater purchase" };

export default async function PaylaterPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="page-container">
      <PurchaseDetailPage purchaseId={id} />
    </div>
  );
}
