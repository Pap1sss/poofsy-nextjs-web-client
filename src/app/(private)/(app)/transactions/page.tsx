import type { Metadata } from "next";
import { Suspense } from "react";

import Loading from "@/components/Loading";
import { TransactionsPage } from "@/features/transaction";

export const metadata: Metadata = {
  title: "Transactions",
  robots: { index: false, follow: false },
};

// The filters read the URL (nuqs), which needs a Suspense boundary on a statically rendered page.
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TransactionsPage />
    </Suspense>
  );
}
