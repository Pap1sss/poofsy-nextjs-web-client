import type { Metadata } from "next";

import { AccountPage } from "@/features/paylater/components/AccountPage";

export const metadata: Metadata = { title: "PayLater account" };

export default async function PaylaterProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="page-container">
      <AccountPage accountId={id} />
    </div>
  );
}
