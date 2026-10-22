"use client";

import { useParams } from "next/navigation";

import Navigate from "@/components/Navigate";
import { routes } from "@/config/routes";

export default function UserPage() {
  const params = useParams();

  return <Navigate to={`${routes.users.details(params.id as string)}`} replace />;
}
