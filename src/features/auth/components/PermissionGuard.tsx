"use client";

import { ReactNode } from "react";
import { emptyAuth, useAuthenticatedUser } from "../api/useAuthenticatedUser";
import { roleEnum } from "../schema/auth";
import NotFound from "@/components/NotFound";

type PPermissionGate = {
  children: ReactNode;
  fallback?: ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean;
  returnNull?: boolean;
  displayAsNotFound?: boolean;
};

const PermissionGate = ({
  children,
  fallback = null,
  requiredPermissions,
  requireAll = false,
  returnNull = false,
  displayAsNotFound = false,
}: PPermissionGate) => {
  const { data: { data: auth } = { success: false, message: "", data: emptyAuth } } =
    useAuthenticatedUser();

  const roles = auth?.roles || [];
  const permissions = auth?.permissions || [];

  const isSuperAdmin = roles.includes(roleEnum.enum["super-admin"]);
  const hasPermission = requireAll
    ? requiredPermissions.every((p) => permissions.includes(p))
    : requiredPermissions.some((p) => permissions.includes(p));

  const isAuthorized = hasPermission || isSuperAdmin;

  if (isAuthorized) return <>{children}</>;
  if (returnNull) return null;
  if (displayAsNotFound) return <NotFound />;
  return <>{fallback}</>;
};

export default PermissionGate;
