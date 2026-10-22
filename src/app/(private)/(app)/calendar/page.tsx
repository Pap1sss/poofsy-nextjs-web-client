import type { Metadata } from "next";
import { Suspense } from "react";

import Loading from "@/components/Loading";
import { CalendarPage } from "@/features/calendar";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

// The month lives in the URL (nuqs), which needs a Suspense boundary on a statically rendered page.
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <CalendarPage />
    </Suspense>
  );
}
