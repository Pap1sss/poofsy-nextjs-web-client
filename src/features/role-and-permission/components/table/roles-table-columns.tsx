"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, Eye, Text, Trash } from "lucide-react";

import { PermissionGate } from "@/features/auth";
import { DataTableColumnHeader } from "@/components/data-table/my-data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/format";
import { RowActionVariant, type DataTableRowAction } from "@/types/data-table";
import { Button, buttonVariants } from "@/components/ui/button";

import { RoleSchema } from "../../schema";
import { rolePermissions } from "../../constant";
import { hasItems } from "@/lib/utils/array";
import { routes } from "@/config/routes";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GetRolesTableColumnsProps {
  setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<RoleSchema> | null>>;
  userPermissions?: string[];
}

export function getRolesTableColumns({
  setRowAction,
  userPermissions = [],
}: GetRolesTableColumnsProps): ColumnDef<RoleSchema>[] {
  const canViewRestrictedInfo = hasItems(
    userPermissions,
    [rolePermissions.ViewRestrictedInfo],
    true
  );

  const canViewActionColumns = hasItems(
    userPermissions,
    [rolePermissions.ForceDelete, rolePermissions.Update],
    false
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
          <Link
            href={routes.roles_and_permissions.detail(id)}
            className={buttonVariants({ variant: "link" })}
          >
            ...{id.slice(-6)}
          </Link>
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
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
      cell: ({ row }) => <div className="w-20">{row.getValue("name")}</div>,
      meta: {
        label: "Name",
        placeholder: "Search names...",
        variant: "text",
        icon: Text,
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    ...(canViewRestrictedInfo
      ? ([
          {
            id: "guard_name",
            accessorKey: "guard_name",
            header: ({ column }) => <DataTableColumnHeader column={column} label="Guard Name" />,
            cell: ({ row }) => <div className="w-20">{row.getValue("guard_name")}</div>,
            meta: {
              label: "Guard Name",
              icon: CalendarIcon,
            },
            enableSorting: false,
            enableColumnFilter: false,
            enableHiding: true,
          },
          {
            id: "created_at",
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
            cell: ({ cell }) => formatDate(cell.getValue<Date>()),
            meta: {
              label: "Created At",
              variant: "dateRange",
              icon: CalendarIcon,
            },
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          },
          {
            id: "updated_at",
            accessorKey: "updated_at",
            header: ({ column }) => <DataTableColumnHeader column={column} label="Updated At" />,
            cell: ({ cell }) => formatDate(cell.getValue<Date>()),
            meta: {
              label: "Updated At",
              variant: "dateRange",
              icon: CalendarIcon,
            },
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          },
        ] as ColumnDef<RoleSchema>[])
      : []),
    ...(canViewActionColumns
      ? ([
          {
            id: "actions",
            header: ({ column }) => (
              <div className="flex justify-center">
                <DataTableColumnHeader column={column} label="Actions" />
              </div>
            ),
            cell: ({ row }) => {
              const role = row.original;

              return (
                <div className="flex justify-center">
                  <ButtonGroup>
                    <PermissionGate requiredPermissions={[rolePermissions.ViewAny]} requireAll>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={routes.roles_and_permissions.detail(role.id)}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                    </PermissionGate>

                    <PermissionGate requiredPermissions={[rolePermissions.ForceDelete]} requireAll>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setRowAction({
                                row,
                                variant: RowActionVariant.ForceDelete,
                              })
                            }
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Force Delete</TooltipContent>
                      </Tooltip>
                    </PermissionGate>
                  </ButtonGroup>
                </div>
              );
            },
            enableSorting: false,
            enableHiding: false,
            enableColumnFilter: false,
            size: 120,
          },
        ] as ColumnDef<RoleSchema>[])
      : []),
  ];
}
