"use client";

import { useParams } from "next/navigation";

import {
  RoleDetails,
  RoleSystemActivities,
  useFetchRoleWithPermissionsById,
} from "@/features/role-and-permission";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";

export default function Page() {
  const params = useParams();
  const roleId = params.id as string;

  const fetchRole = useFetchRoleWithPermissionsById(roleId);
  const role = fetchRole.data?.data;

  // Otherwise the crumb title-cases the role id.
  useSetBreadcrumbTitle(role?.name);

  return (
    <div>
      {role && (
        <>
          <RoleDetails role={role} />
          {/* Inline at the bottom, matching the user detail page, rather than
              behind its own tab. */}
          <RoleSystemActivities roleId={roleId} />
        </>
      )}
    </div>
  );
}
