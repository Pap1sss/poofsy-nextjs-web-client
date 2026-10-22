import type { Metadata } from "next";

import DeductionTypesPage from "@/features/deduction-type/components/DeductionTypesPage";

export const metadata: Metadata = { title: "Deduction types" };

export default function Page() {
  return <DeductionTypesPage />;
}
