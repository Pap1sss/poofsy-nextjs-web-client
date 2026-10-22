"use client";

import { SystemActivities } from "@/features/system-activity";
import { PermissionGate } from "@/features/auth";

import { useFetchUserSystemActivitiesById } from "../hooks/useFetchUserSystemActivitiesById";
import { userPermissions } from "../constant";

type UserIdProps = {
  userId: string;
};

export function UserSystemActivitiesContent({ userId }: UserIdProps) {
  return <SystemActivities query={useFetchUserSystemActivitiesById(userId)} className="mt-4" />;
}

export default function UserSystemActivities({ userId }: UserIdProps) {
  return (
    <PermissionGate
      requiredPermissions={[userPermissions.ViewSystemActivity]}
      returnNull
      requireAll
    >
      <UserSystemActivitiesContent userId={userId} />
    </PermissionGate>
  );
}
