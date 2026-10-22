import type { Metadata } from "next";

import BillsPage from "@/features/bill/components/BillsPage";

export const metadata: Metadata = { title: "Bills" };

export default function Page() {
  return <BillsPage />;
}
