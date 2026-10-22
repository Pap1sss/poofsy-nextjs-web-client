"use client";

import { SystemActivities } from "@/features/system-activity";
import { PermissionGate } from "@/features/auth";

import { useFetchRoleSystemActivitiesById } from "../hooks/useFetchRoleSystemActivitiesById";
import { rolePermissions } from "../constant";

type RoleIdProps = {
  roleId: string;
};

export function RoleSystemActivitiesContent({ roleId }: RoleIdProps) {
  return <SystemActivities query={useFetchRoleSystemActivitiesById(roleId)} className="mt-4" />;
}

export default function RoleSystemActivities({ roleId }: RoleIdProps) {
  return (
    <PermissionGate
      requiredPermissions={[rolePermissions.ViewSystemActivity]}
      returnNull
      requireAll
    >
      <RoleSystemActivitiesContent roleId={roleId} />
    </PermissionGate>
  );
}
