import type { Metadata } from "next";

import { GuidePage } from "@/features/guide";

export const metadata: Metadata = {
  title: "How It Works",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GuidePage />;
}
