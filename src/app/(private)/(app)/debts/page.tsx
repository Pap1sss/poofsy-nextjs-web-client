import type { Metadata } from "next";

import DebtsPage from "@/features/debt/components/DebtsPage";

export const metadata: Metadata = { title: "Debts" };

export default function Page() {
  return <DebtsPage />;
}
