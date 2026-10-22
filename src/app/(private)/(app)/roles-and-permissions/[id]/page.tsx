"use client";

import { useParams } from "next/navigation";

import Navigate from "@/components/Navigate";
import { routes } from "@/config/routes";

export default function RolePage() {
  const params = useParams();

  return <Navigate to={`${routes.roles_and_permissions.details(params.id as string)}`} replace />;
}
