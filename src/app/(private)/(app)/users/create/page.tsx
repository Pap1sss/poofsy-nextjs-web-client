"use client";

import { PermissionGate } from "@/features/auth";
import { userPermissions } from "@/features/user/constant";
import UserCreatePage from "@/features/user/components/user-create-page";

export default function Page() {
  return (
    <PermissionGate requiredPermissions={[userPermissions.Create]} displayAsNotFound>
      <div className="page-container space-y-4">
        <UserCreatePage />
      </div>
    </PermissionGate>
  );
}
