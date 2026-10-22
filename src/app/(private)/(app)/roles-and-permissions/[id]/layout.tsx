"use client";

import { useParams } from "next/navigation";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { PermissionGate } from "@/features/auth";
import { rolePermissions, useFetchRoleWithPermissionsById } from "@/features/role-and-permission";

function RoleLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const roleId = params.id as string;

  const fetchRole = useFetchRoleWithPermissionsById(roleId);

  if (fetchRole.data?.success) {
    return <div className="page-container space-y-4">{children}</div>;
  }

  if (fetchRole.isError) {
    return <Error message={fetchRole.error.message} />;
  }

  return <Loading />;
}

export default function RoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate requiredPermissions={[rolePermissions.ViewAny]} displayAsNotFound requireAll>
      <RoleLayoutContent>{children}</RoleLayoutContent>
    </PermissionGate>
  );
}
