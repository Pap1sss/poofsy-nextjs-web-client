import type { Metadata } from "next";

import { AccountDetailPage } from "@/features/account/components/AccountDetailPage";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <AccountDetailPage accountId={id} />;
}
