"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, Text } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/my-data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { hasItems } from "@/lib/utils/array";

import { SystemActivityListItem } from "../../schema";
import { systemActivityPermissions } from "../../constant";
import { formatDateTime } from "@/lib/utils/date";

interface GetSystemActivitiesTableColumnsProps {
  userPermissions?: string[];
}

export function getSystemActivitiesTableColumns({
  userPermissions = [],
}: GetSystemActivitiesTableColumnsProps): ColumnDef<SystemActivityListItem>[] {
  const canViewRestrictedInfo = hasItems(
    userPermissions,
    [systemActivityPermissions.ViewRestrictedInfo],
    true
  );

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          className="translate-y-0.5"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          className="translate-y-0.5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      enableColumnFilter: false,
      size: 40,
    },
    {
      id: "id",
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} label="ID" />,
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        return (
          <span className="font-mono text-xs text-muted-foreground" title={id}>
            ...{id.slice(-6)}
          </span>
        );
      },
      meta: {
        label: "ID",
        placeholder: "Search IDs...",
        variant: "text",
        icon: Text,
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      id: "log_name",
      accessorKey: "log_name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Log Name" />,
      cell: ({ row }) => <div className="w-32">{row.getValue("log_name")}</div>,
      meta: {
        label: "Log Name",
        placeholder: "Search log names...",
        variant: "text",
        icon: Text,
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Description" />,
      cell: ({ row }) => <div className="w-48 truncate">{row.getValue("description")}</div>,
      meta: {
        label: "Description",
        placeholder: "Search descriptions...",
        variant: "text",
        icon: Text,
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      id: "event",
      accessorKey: "event",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Event" />,
      cell: ({ row }) => <div className="w-24">{row.getValue("event")}</div>,
      meta: {
        label: "Event",
        placeholder: "Search events...",
        variant: "text",
        icon: Text,
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      id: "subject_type",
      accessorKey: "subject_type",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Subject Type" />,
      cell: ({ row }) => <div className="w-32 truncate">{row.getValue("subject_type")}</div>,
      meta: {
        label: "Subject Type",
        placeholder: "Search subject types...",
        variant: "text",
        icon: Text,
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      id: "causer_name",
      accessorKey: "causer_name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Causer" />,
      cell: ({ row }) => <div className="w-32">{row.getValue("causer_name")}</div>,
      meta: {
        label: "Causer",
        placeholder: "Search causers...",
        variant: "text",
        icon: Text,
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: false,
    },

    ...(canViewRestrictedInfo
      ? ([
          {
            id: "created_at",
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
            cell: ({ row }) => {
              return <div className="w-38">{formatDateTime(row.getValue("created_at"))}</div>;
            },
            meta: {
              label: "Created At",
              variant: "dateRange",
              icon: CalendarIcon,
            },
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          },
        ] as ColumnDef<SystemActivityListItem>[])
      : []),
  ];
}
