import type { Metadata } from "next";
import { Register } from "@/features/auth";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <Register />;
}
