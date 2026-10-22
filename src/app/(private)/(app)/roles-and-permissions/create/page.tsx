"use client";

import { PermissionGate } from "@/features/auth";
import { rolePermissions } from "@/features/role-and-permission";
import RoleCreatePage from "@/features/role-and-permission/components/form/role-create-page";

export default function Page() {
  return (
    <PermissionGate requiredPermissions={[rolePermissions.Create]} displayAsNotFound>
      <div className="page-container space-y-4">
        <RoleCreatePage />
      </div>
    </PermissionGate>
  );
}
