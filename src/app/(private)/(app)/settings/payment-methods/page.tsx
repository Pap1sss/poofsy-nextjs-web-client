import type { Metadata } from "next";

import PaymentMethodsPage from "@/features/payment-method/components/PaymentMethodsPage";

export const metadata: Metadata = { title: "Payment methods" };

export default function Page() {
  return <PaymentMethodsPage />;
}
