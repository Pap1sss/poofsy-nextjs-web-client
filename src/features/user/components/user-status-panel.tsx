"use client";

import { UserCheck, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PermissionGate, useAuth } from "@/features/auth";
import { cn } from "@/lib/utils/component";
import { formatDateTime } from "@/lib/utils/date";

import { userPermissions } from "../constant";
import { UserListItem } from "../schema";
import { UserStatusDialog } from "./table/user-status-dialog";

/** Account status on the user detail page, with the deactivate / reactivate action. */
export function UserStatusPanel({ user }: { user: UserListItem }) {
  const { data: auth } = useAuth();
  const isSelf = auth?.data?.id === user.id;
  const deactivated = !!user.deactivated_at;
  const Icon = deactivated ? UserX : UserCheck;

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        deactivated ? "border-destructive/40 bg-destructive/5" : "bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            deactivated ? "text-destructive" : "text-muted-foreground"
          )}
        />
        <div className="space-y-0.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            Account status
            {deactivated ? (
              <Badge variant="destructive">Deactivated</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {deactivated
              ? `Deactivated on ${formatDateTime(user.deactivated_at, "MMM dd yyyy, h:mm a")}. They can't sign in until reactivated.`
              : "Can sign in. Deactivating signs them out everywhere and blocks sign-in without deleting anything."}
          </p>
        </div>
      </div>

      {!isSelf && (
        <PermissionGate requiredPermissions={[userPermissions.Deactivate]} requireAll returnNull>
          <UserStatusDialog action={deactivated ? "reactivate" : "deactivate"} users={[user]} />
        </PermissionGate>
      )}
    </div>
  );
}
