"use client";

import { useParams } from "next/navigation";

import { PermissionGate } from "@/features/auth";
import { userPermissions, userTabLinks, useFetchUserById } from "@/features/user";
import TabLinks from "@/components/tab-links";
import Error from "@/components/Error";
import Loading from "@/components/Loading";

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const userId = params.id as string;

  // Pre-fetch required data for child components
  const fetchUser = useFetchUserById(userId);

  if (fetchUser.data?.success) {
    return (
      <div className="page-container space-y-4">
        <TabLinks tabLinks={userTabLinks} resourceId={userId} />
        <div className="mt-4">{children}</div>
      </div>
    );
  }

  if (fetchUser.isError) {
    return <Error message={fetchUser.error.message} />;
  }

  return <Loading />;
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate requiredPermissions={[userPermissions.ViewAny]} displayAsNotFound requireAll>
      <UserLayoutContent>{children}</UserLayoutContent>
    </PermissionGate>
  );
}
