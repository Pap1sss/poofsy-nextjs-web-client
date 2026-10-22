import type { Metadata } from "next";

import IncomeSourcesPage from "@/features/income/components/IncomeSourcesPage";

export const metadata: Metadata = { title: "Income sources" };

export default function IncomeSourcesRoute() {
  return <IncomeSourcesPage />;
}
