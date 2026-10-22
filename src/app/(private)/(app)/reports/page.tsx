import type { Metadata } from "next";

import ReportsPage from "@/features/report/components/reports-page";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReportsPage />;
}
