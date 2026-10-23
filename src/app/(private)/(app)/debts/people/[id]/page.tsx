import type { Metadata } from "next";

import { PersonPage } from "@/features/debt/components/PersonPage";

export const metadata: Metadata = { title: "Person" };

export default async function DebtPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="page-container">
      <PersonPage personId={id} />
    </div>
  );
}
