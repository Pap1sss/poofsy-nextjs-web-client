import type { Metadata } from "next";

import AccountsPage from "@/features/account/components/AccountsPage";

export const metadata: Metadata = { title: "Accounts & wallets" };

export default function Page() {
  return <AccountsPage />;
}
