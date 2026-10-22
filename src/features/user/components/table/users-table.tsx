"use client";

import * as React from "react";
import { DataTableRowAction, QueryKeys, RowActionVariant } from "@/types/data-table";

import { UserListItem, UserListResSchema } from "../../schema";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/my-data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/my-data-table-advanced-toolbar";
import { DataTableSortList } from "@/components/data-table/my-data-table-sort-list";
import { DataTableFilterList } from "@/components/data-table/my-data-table-filter-list";
import { DataTableToolbar } from "@/components/data-table/my-data-table-toolbar";
import { useAuth, useUserPermissions } from "@/features/auth";
import WithTrashToggleGroup from "@/components/with-trash-toggle-group";

import { DeleteUsersDialog } from "./delete-users-dialog";
import { UpdateUserSheet } from "./update-user-sheet";
import { getUsersTableColumns } from "./users-table-columns";
import { useFetchRoleNames } from "@/features/role-and-permission/hooks/useFetchRoleNames";
import { UsersTableActionBar } from "./users-table-action-bar";
import { RestoreUserDialog } from "./restore-user-dialog";
import { ForceDeleteUserDialog } from "./force-delete-user-dialog";
import { SendResetLinkDialog } from "./send-reset-link-dialog";
import { UserStatusDialog } from "./user-status-dialog";

interface UsersTableProps {
  data: UserListResSchema;
  queryKeys?: Partial<QueryKeys>;
}
const ENABLE_ADVANCED_FILTER = true;

export default function UsersTable({ data, queryKeys }: UsersTableProps) {
  const authUserPermissions = useUserPermissions();
  const { data: auth } = useAuth();
  const authUserId = auth?.data?.id;

  const [rowAction, setRowAction] = React.useState<DataTableRowAction<UserListItem> | null>(null);

  const { data: roleNames } = useFetchRoleNames();
  const roleOptions = roleNames?.data;

  const columns = React.useMemo(
    () => getUsersTableColumns({ setRowAction, authUserPermissions, roleOptions, authUserId }),
    [authUserPermissions, roleOptions, authUserId]
  );

  const { table, shallow, throttleMs } = useDataTable({
    data: data.data.data,
    columns,
    pageCount: data.data.meta.last_page,
    enableAdvancedFilter: ENABLE_ADVANCED_FILTER,
    initialState: {
      sorting: [{ id: "created_at", desc: true }],
      columnPinning: { right: ["actions"] },
      columnVisibility: { deleted_at: false },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable table={table} actionBar={<UsersTableActionBar table={table} />}>
        {/* TODO: Make this dynamic */}
        {ENABLE_ADVANCED_FILTER ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            <DataTableFilterList
              table={table}
              shallow={shallow}
              throttleMs={throttleMs}
              align="start"
            />
            <WithTrashToggleGroup />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>

      <SendResetLinkDialog
        open={rowAction?.variant === RowActionVariant.ResetPassword}
        onOpenChange={() => setRowAction(null)}
        user={rowAction?.row.original ?? null}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />

      <UpdateUserSheet
        open={rowAction?.variant === RowActionVariant.Update}
        onOpenChange={() => setRowAction(null)}
        user={rowAction?.row.original ?? null}
      />

      <RestoreUserDialog
        open={rowAction?.variant === RowActionVariant.Restore}
        onOpenChange={() => setRowAction(null)}
        user={rowAction?.row.original ?? null}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />

      <ForceDeleteUserDialog
        open={rowAction?.variant === RowActionVariant.ForceDelete}
        onOpenChange={() => setRowAction(null)}
        users={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
      <UserStatusDialog
        action={rowAction?.variant === RowActionVariant.Reactivate ? "reactivate" : "deactivate"}
        open={
          rowAction?.variant === RowActionVariant.Deactivate ||
          rowAction?.variant === RowActionVariant.Reactivate
        }
        onOpenChange={() => setRowAction(null)}
        users={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
      <DeleteUsersDialog
        open={rowAction?.variant === RowActionVariant.Delete}
        onOpenChange={() => setRowAction(null)}
        users={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}
