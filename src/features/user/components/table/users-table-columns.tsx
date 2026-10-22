"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  CircleDot,
  KeyRound,
  Pencil,
  Text,
  Trash,
  Trash2,
  Eye,
  RotateCcw,
  UserCheck,
  UserX,
} from "lucide-react";

import { PermissionGate } from "@/features/auth";
import { DataTableColumnHeader } from "@/components/data-table/my-data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RowActionVariant, type DataTableRowAction } from "@/types/data-table";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { routes } from "@/config/routes";
import { hasItems } from "@/lib/utils/array";

import { UserListItem } from "../../schema";
import { userPermissions } from "../../constant";
import { formatDateTime } from "@/lib/utils/date";

interface GetUsersTableColumnsProps {
  setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<UserListItem> | null>>;
  authUserPermissions?: string[];
  roleOptions?: string[];
  authUserId?: string;
}

export function getUsersTableColumns({
  setRowAction,
  authUserPermissions = [],
  roleOptions = [],
  authUserId,
}: GetUsersTableColumnsProps): ColumnDef<UserListItem>[] {
  const canViewRestrictedInfo = hasItems(
    authUserPermissions,
    [userPermissions.ViewRestrictedInfo],
    true
  );

  const canViewActionColumns = hasItems(
    authUserPermissions,
    [
      userPermissions.Update,
      userPermissions.Delete,
      userPermissions.ForceDelete,
      userPermissions.Restore,
      userPermissions.Deactivate,
    ],
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
      id: "email",
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Email" />,
      cell: ({ row }) => <div className="w-20">{row.getValue("email")}</div>,
      meta: {
        label: "Email",
        placeholder: "Search emails...",
        variant: "text",
        icon: Text,
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      id: "username",
      accessorKey: "username",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Username" />,
      cell: ({ row }) => row.original.username,
      meta: {
        label: "Username",
        placeholder: "Search usernames...",
        variant: "text",
        icon: Text,
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      // `name` maps to every name column in UserService, so a search for
      // "Jane Doe" matches across first, middle and last name.
      id: "name",
      accessorFn: (row) => row.profile.full_name,
      header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Link
            href={routes.users.detail(user.id)}
            className="font-medium hover:text-primary hover:underline"
          >
            {user.profile.full_name}
          </Link>
        );
      },
      meta: {
        label: "Name",
        placeholder: "Search names...",
        variant: "text",
        icon: Text,
      },
      enableHiding: true,
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      id: "roles",
      accessorKey: "roles",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Roles" />,
      cell: ({ row }) => {
        const roles = row.getValue("roles") as string[];

        if (!roles || roles.length === 0) {
          return <span className="text-muted-foreground text-sm">No roles</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
      meta: {
        label: "Roles",
        variant: "multiSelect",
        options: roleOptions.map((role) => ({ label: role, value: role })),
      },
      enableHiding: true,
      enableSorting: false,
      enableColumnFilter: roleOptions.length > 0,
    },
    {
      // Maps to a nullable-column status filter on the API (deactivated_at).
      id: "status",
      accessorFn: (row) => (row.deactivated_at ? "deactivated" : "active"),
      header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
      cell: ({ row }) =>
        row.original.deactivated_at ? (
          <Badge variant="destructive">Deactivated</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        ),
      meta: {
        label: "Status",
        variant: "select",
        icon: CircleDot,
        options: [
          { label: "Active", value: "active" },
          { label: "Deactivated", value: "deactivated" },
        ],
      },
      enableHiding: true,
      enableSorting: false,
      enableColumnFilter: true,
    },
    ...(canViewRestrictedInfo
      ? ([
          {
            id: "created_at",
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
            cell: ({ cell }) => formatDateTime(cell.getValue<Date>()),
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
            cell: ({ cell }) => formatDateTime(cell.getValue<Date>()),
            meta: {
              label: "Updated At",
              variant: "dateRange",
              icon: CalendarIcon,
            },
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          },
          {
            id: "deleted_at",
            accessorKey: "deleted_at",
            header: ({ column }) => <DataTableColumnHeader column={column} label="Deleted At" />,
            cell: ({ cell }) => formatDateTime(cell.getValue<Date>()),
            meta: {
              label: "Deleted At",
              variant: "dateRange",
              icon: CalendarIcon,
            },
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          },
        ] as ColumnDef<UserListItem>[])
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
              const user = row.original;
              return (
                <div className="flex justify-center">
                  <ButtonGroup>
                    {!user.deleted_at && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={routes.users.detail(user.id)}
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>View</TooltipContent>
                        </Tooltip>
                        <PermissionGate
                          requiredPermissions={[userPermissions.Update]}
                          requireAll
                          returnNull
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRowAction({
                                    row,
                                    variant: RowActionVariant.Update,
                                  })
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </PermissionGate>
                        <PermissionGate
                          requiredPermissions={[userPermissions.ResetPassword]}
                          requireAll
                          returnNull
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRowAction({
                                    row,
                                    variant: RowActionVariant.ResetPassword,
                                  })
                                }
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send password reset link</TooltipContent>
                          </Tooltip>
                        </PermissionGate>
                        {user.id !== authUserId && (
                          <PermissionGate
                            requiredPermissions={[userPermissions.Deactivate]}
                            requireAll
                            returnNull
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setRowAction({
                                      row,
                                      variant: user.deactivated_at
                                        ? RowActionVariant.Reactivate
                                        : RowActionVariant.Deactivate,
                                    })
                                  }
                                >
                                  {user.deactivated_at ? (
                                    <UserCheck className="h-4 w-4" />
                                  ) : (
                                    <UserX className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {user.deactivated_at ? "Reactivate" : "Deactivate"}
                              </TooltipContent>
                            </Tooltip>
                          </PermissionGate>
                        )}
                        <PermissionGate
                          requiredPermissions={[userPermissions.Delete]}
                          requireAll
                          returnNull
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  setRowAction({
                                    row,
                                    variant: RowActionVariant.Delete,
                                  })
                                }
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </PermissionGate>
                      </>
                    )}

                    {user.deleted_at && (
                      <>
                        <PermissionGate
                          requiredPermissions={[userPermissions.Restore]}
                          requireAll
                          returnNull
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRowAction({
                                    row,
                                    variant: RowActionVariant.Restore,
                                  })
                                }
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Restore</TooltipContent>
                          </Tooltip>
                        </PermissionGate>

                        <PermissionGate
                          requiredPermissions={[userPermissions.ForceDelete]}
                          requireAll
                          returnNull
                        >
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
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Force Delete</TooltipContent>
                          </Tooltip>
                        </PermissionGate>
                      </>
                    )}
                  </ButtonGroup>
                </div>
              );
            },
            enableSorting: false,
            enableHiding: false,
            enableColumnFilter: false,
            size: 120,
          },
        ] as ColumnDef<UserListItem>[])
      : []),
  ];
}
