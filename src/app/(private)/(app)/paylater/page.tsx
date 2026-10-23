import type { Metadata } from "next";

import PaylaterPage from "@/features/paylater/components/PaylaterPage";

export const metadata: Metadata = { title: "PayLater" };

export default function Page() {
  return <PaylaterPage />;
}
