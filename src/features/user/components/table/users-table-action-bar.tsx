"use client";

import type { Table } from "@tanstack/react-table";
import {
  Download,
  RotateCcw,
  ShieldMinus,
  ShieldPlus,
  Trash,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@/components/ui/action-bar";
import { PermissionGate } from "@/features/auth";

import { userPermissions } from "../../constant";
import { useExportUsers } from "../../hooks";
import { UserListItem } from "../../schema";
import { BulkRestoreUsersDialog } from "./bulk-restore-users-dialog";
import { BulkUserRolesDialog } from "./bulk-user-roles-dialog";
import { DeleteUsersDialog } from "./delete-users-dialog";
import { ForceDeleteUserDialog } from "./force-delete-user-dialog";
import { UserStatusDialog } from "./user-status-dialog";

type BulkAction =
  | "delete"
  | "force-delete"
  | "restore"
  | "assign-roles"
  | "remove-roles"
  | "deactivate"
  | "reactivate"
  | null;

interface UsersTableActionBarProps {
  table: Table<UserListItem>;
}

export function UsersTableActionBar({ table }: UsersTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [action, setAction] = React.useState<BulkAction>(null);

  const selected = rows.map((row) => row.original);
  const ids = selected.map((user) => user.id);

  // Bulk endpoints are all-or-nothing: delete rejects trashed rows and restore
  // rejects live ones. Only offer the action a whole selection can satisfy so a
  // mixed selection can't produce a guaranteed failure.
  const allLive = selected.length > 0 && selected.every((user) => !user.deleted_at);
  const allTrashed = selected.length > 0 && selected.every((user) => !!user.deleted_at);

  // Status changes skip users already in that state, so each action only needs someone to change.
  const toDeactivate = selected.filter((user) => !user.deactivated_at);
  const toReactivate = selected.filter((user) => !!user.deactivated_at);

  // Restore and force-delete are fired from their confirmation dialogs, which
  // own those mutations; only export runs straight off the bar.
  const { mutate: exportUsers, isPending: isExporting } = useExportUsers();

  const clearSelection = React.useCallback(() => {
    table.toggleAllRowsSelected(false);
  }, [table]);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) clearSelection();
    },
    [clearSelection]
  );

  /**
   * ActionBarItem closes the bar after every click, which clears the selection
   * out from under any dialog we just opened. preventDefault() is the component's
   * own escape hatch (it bails before calling onOpenChange), so each action keeps
   * the selection and we clear it ourselves once the work actually succeeds.
   */
  const keepSelection = (event: React.MouseEvent) => event.preventDefault();

  const handlers = {
    onSuccess: ({ message }: { message: string }) => {
      toast.success(message);
      clearSelection();
    },
    onError: ({ message }: { message: string }) => toast.error(message),
  };

  return (
    <>
      <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
        <ActionBarSelection>
          <span className="font-medium">{rows.length}</span>
          <span>selected</span>
          <ActionBarSeparator />
          <ActionBarClose>
            <X />
          </ActionBarClose>
        </ActionBarSelection>
        <ActionBarSeparator />
        <ActionBarGroup>
          <PermissionGate requiredPermissions={[userPermissions.Export]} requireAll returnNull>
            <ActionBarItem
              disabled={isExporting}
              onClick={(event) => {
                keepSelection(event);
                exportUsers(ids, handlers);
              }}
            >
              <Download />
              Export
            </ActionBarItem>
          </PermissionGate>

          {allLive && (
            <PermissionGate requiredPermissions={[userPermissions.Update]} requireAll returnNull>
              <ActionBarItem
                onClick={(event) => {
                  keepSelection(event);
                  setAction("assign-roles");
                }}
              >
                <ShieldPlus />
                Assign roles
              </ActionBarItem>
              <ActionBarItem
                onClick={(event) => {
                  keepSelection(event);
                  setAction("remove-roles");
                }}
              >
                <ShieldMinus />
                Remove roles
              </ActionBarItem>
            </PermissionGate>
          )}

          {allLive && (
            <PermissionGate
              requiredPermissions={[userPermissions.Deactivate]}
              requireAll
              returnNull
            >
              {toDeactivate.length > 0 && (
                <ActionBarItem
                  onClick={(event) => {
                    keepSelection(event);
                    setAction("deactivate");
                  }}
                >
                  <UserX />
                  Deactivate
                </ActionBarItem>
              )}
              {toReactivate.length > 0 && (
                <ActionBarItem
                  onClick={(event) => {
                    keepSelection(event);
                    setAction("reactivate");
                  }}
                >
                  <UserCheck />
                  Reactivate
                </ActionBarItem>
              )}
            </PermissionGate>
          )}

          {allLive && (
            <PermissionGate requiredPermissions={[userPermissions.Delete]} requireAll returnNull>
              <ActionBarItem
                variant="destructive"
                onClick={(event) => {
                  keepSelection(event);
                  setAction("delete");
                }}
              >
                <Trash />
                Delete
              </ActionBarItem>
            </PermissionGate>
          )}

          {allTrashed && (
            <PermissionGate requiredPermissions={[userPermissions.Restore]} requireAll returnNull>
              <ActionBarItem
                onClick={(event) => {
                  keepSelection(event);
                  setAction("restore");
                }}
              >
                <RotateCcw />
                Restore
              </ActionBarItem>
            </PermissionGate>
          )}

          {allTrashed && (
            <PermissionGate
              requiredPermissions={[userPermissions.ForceDelete]}
              requireAll
              returnNull
            >
              <ActionBarItem
                variant="destructive"
                onClick={(event) => {
                  keepSelection(event);
                  setAction("force-delete");
                }}
              >
                <Trash2 />
                Delete permanently
              </ActionBarItem>
            </PermissionGate>
          )}
        </ActionBarGroup>
      </ActionBar>

      <DeleteUsersDialog
        open={action === "delete"}
        onOpenChange={(open) => !open && setAction(null)}
        users={selected}
        showTrigger={false}
        onSuccess={clearSelection}
      />

      <BulkUserRolesDialog
        open={action === "assign-roles"}
        onOpenChange={(open) => !open && setAction(null)}
        users={selected}
        mode="assign"
        onSuccess={clearSelection}
      />

      <BulkUserRolesDialog
        open={action === "remove-roles"}
        onOpenChange={(open) => !open && setAction(null)}
        users={selected}
        mode="remove"
        onSuccess={clearSelection}
      />

      <UserStatusDialog
        action="deactivate"
        open={action === "deactivate"}
        onOpenChange={(open) => !open && setAction(null)}
        users={toDeactivate}
        showTrigger={false}
        onSuccess={clearSelection}
      />

      <UserStatusDialog
        action="reactivate"
        open={action === "reactivate"}
        onOpenChange={(open) => !open && setAction(null)}
        users={toReactivate}
        showTrigger={false}
        onSuccess={clearSelection}
      />

      <BulkRestoreUsersDialog
        open={action === "restore"}
        onOpenChange={(open) => !open && setAction(null)}
        users={selected}
        showTrigger={false}
        onSuccess={clearSelection}
      />

      <ForceDeleteUserDialog
        open={action === "force-delete"}
        onOpenChange={(open) => !open && setAction(null)}
        users={selected}
        showTrigger={false}
        onSuccess={clearSelection}
      />
    </>
  );
}
