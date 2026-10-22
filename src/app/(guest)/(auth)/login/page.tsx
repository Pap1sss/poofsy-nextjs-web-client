import type { Metadata } from "next";
import { Login } from "@/features/auth";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <Login />;
}
