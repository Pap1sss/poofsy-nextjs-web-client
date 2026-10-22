"use client";

import { useParams } from "next/navigation";

import {
  UserDetails,
  UserStatusPanel,
  UserSystemActivities,
  useFetchUserById,
} from "@/features/user";
import { useSetBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";

export default function Page() {
  const params = useParams();
  const userId = params.id as string;

  const fetchUser = useFetchUserById(userId);
  const user = fetchUser.data?.data;

  // Otherwise the crumb title-cases the user id.
  useSetBreadcrumbTitle(user?.profile.full_name);

  return (
    <div>
      {user && (
        <>
          <UserStatusPanel user={user} />
          <UserDetails user={user} />
          <UserSystemActivities userId={user.id} />
        </>
      )}
    </div>
  );
}
