"use client";

import { Mail, ShieldCheck } from "lucide-react";
import Error from "@/components/Error";
import { Sprite } from "@/components/pixel/sprites";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProfilePage, useFetchMyProfile } from "@/features/user";

export default function UserProfilePage() {
  // users/mine, not users/{id}: the latter is the admin back office and answers 403 to everyone else.
  const fetchUser = useFetchMyProfile();
  const user = fetchUser.data?.data;

  if (fetchUser.isError) {
    return (
      <div className="page-container">
        <Error message={`Couldn't load your profile: ${fetchUser.error.message}`} />
      </div>
    );
  }

  const initials = user
    ? `${user.profile.first_name?.[0] ?? ""}${user.profile.last_name?.[0] ?? ""}`.toUpperCase() ||
      "?"
    : "?";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div className="page-container space-y-4">
      {/* ── Player card ─────────────────────────────────────── */}
      <div className="pixel-panel">
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          {fetchUser.isLoading ? (
            <Skeleton className="h-16 w-16 shrink-0" />
          ) : (
            <div className="flex shrink-0 items-end gap-2">
              <Sprite name="mascot" size={40} />
              <div className="pixel-box bg-primary text-primary-foreground font-pixel flex h-14 w-14 items-center justify-center text-xl">
                {initials}
              </div>
            </div>
          )}

          {/* Identity */}
          <div className="flex-1 min-w-0">
            {fetchUser.isLoading ? (
              <>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : (
              <>
                <h1 className="text-lg md:text-xl truncate">
                  {user?.profile.full_name || "Unnamed"}
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
              </>
            )}

            {/* Roles + meta */}
            {!fetchUser.isLoading && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {user?.roles?.map((role) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground"
                  >
                    <ShieldCheck size={10} className="mr-1" />
                    {role}
                  </Badge>
                ))}
                {memberSince && (
                  <span className="font-pixel text-xs text-muted-foreground">
                    Member since {memberSince}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────── */}
      {fetchUser.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        user && <ProfilePage user={user} />
      )}
    </div>
  );
}
