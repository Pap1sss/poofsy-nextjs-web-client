"use client";

import * as React from "react";

import { DataTableRowAction, QueryKeys, RowActionVariant } from "@/types/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/my-data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/my-data-table-advanced-toolbar";
import { DataTableSortList } from "@/components/data-table/my-data-table-sort-list";
import { DataTableFilterList } from "@/components/data-table/my-data-table-filter-list";
import { DataTableToolbar } from "@/components/data-table/my-data-table-toolbar";
import { useUserPermissions } from "@/features/auth";

import { RoleSchema, RolesPaginatedResSchema } from "../../schema";
import { getRolesTableColumns } from "./roles-table-columns";
import { ForceDeleteRoleDialog } from "./force-delete-role-dialog";
import { RolesTableActionBar } from "./roles-table-action-bar";

interface RolesTableProps {
  data: RolesPaginatedResSchema;
  queryKeys?: Partial<QueryKeys>;
}
const ENABLE_ADVANCED_FILTER = true;

export default function RolesTable({ data, queryKeys }: RolesTableProps) {
  "use no memo";

  const userPermissions = useUserPermissions();

  const [rowAction, setRowAction] = React.useState<DataTableRowAction<RoleSchema> | null>(null);

  const columns = React.useMemo(
    () => getRolesTableColumns({ setRowAction, userPermissions }),
    [userPermissions]
  );

  const { table, shallow, throttleMs } = useDataTable({
    data: data.data.data,
    columns,
    pageCount: data.data.meta.last_page,
    enableAdvancedFilter: ENABLE_ADVANCED_FILTER,
    initialState: {
      sorting: [{ id: "created_at", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable table={table} actionBar={<RolesTableActionBar table={table} />}>
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
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>

      <ForceDeleteRoleDialog
        open={rowAction?.variant === RowActionVariant.ForceDelete}
        onOpenChange={() => setRowAction(null)}
        roles={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}
