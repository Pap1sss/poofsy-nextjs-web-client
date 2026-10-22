import type { Metadata } from "next";

import PayScheduleSettings from "@/features/pay-schedule/components/PayScheduleSettings";

export const metadata: Metadata = { title: "Pay schedule" };

export default function PaySchedulePage() {
  return <PayScheduleSettings />;
}
