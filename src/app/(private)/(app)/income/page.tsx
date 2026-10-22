import type { Metadata } from "next";

import IncomeRecordsPage from "@/features/income/components/IncomeRecordsPage";

export const metadata: Metadata = { title: "Income" };

export default function IncomePage() {
  return <IncomeRecordsPage />;
}
