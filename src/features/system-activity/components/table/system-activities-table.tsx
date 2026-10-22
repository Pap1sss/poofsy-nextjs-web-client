"use client";

import * as React from "react";

import { QueryKeys } from "@/types/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/my-data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/my-data-table-advanced-toolbar";
import { DataTableSortList } from "@/components/data-table/my-data-table-sort-list";
import { DataTableFilterList } from "@/components/data-table/my-data-table-filter-list";
import { DataTableToolbar } from "@/components/data-table/my-data-table-toolbar";
import { useUserPermissions } from "@/features/auth";

import { SystemActivityListPaginatedResSchema } from "../../schema";
import { getSystemActivitiesTableColumns } from "./system-activities-table-columns";

interface SystemActivitiesTableProps {
  data: SystemActivityListPaginatedResSchema;
  queryKeys?: Partial<QueryKeys>;
}
const ENABLE_ADVANCED_FILTER = true;

export default function SystemActivitiesTable({ data, queryKeys }: SystemActivitiesTableProps) {
  "use no memo";

  // Pre-fetch this on parent then use this hook in the getSystemActivitiesTableColumns
  const userPermissions = useUserPermissions();

  const columns = React.useMemo(
    () => getSystemActivitiesTableColumns({ userPermissions }),
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
      columnVisibility: {
        created_at: false,
      },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      {/* No action bar: the audit log is read-only, and with CSV export gone
          there is no bulk action left for a selection to perform. */}
      <DataTable table={table}>
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
    </>
  );
}
