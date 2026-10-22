"use client";

import type { Table } from "@tanstack/react-table";
import { Trash2, X } from "lucide-react";
import * as React from "react";

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from "@/components/ui/action-bar";
import { PermissionGate } from "@/features/auth";

import { rolePermissions } from "../../constant";
import { RoleSchema } from "../../schema";
import { ForceDeleteRoleDialog } from "./force-delete-role-dialog";

interface RolesTableActionBarProps {
  table: Table<RoleSchema>;
}

export function RolesTableActionBar({ table }: RolesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [showDelete, setShowDelete] = React.useState(false);

  const selected = rows.map((row) => row.original);

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
   * ActionBarItem closes the bar after every click, which would clear the
   * selection before the delete dialog could read it. preventDefault() is the
   * component's own escape hatch — it bails before calling onOpenChange.
   */
  const keepSelection = (event: React.MouseEvent) => event.preventDefault();

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
          <PermissionGate requiredPermissions={[rolePermissions.ForceDelete]} requireAll returnNull>
            <ActionBarItem
              variant="destructive"
              onClick={(event) => {
                keepSelection(event);
                setShowDelete(true);
              }}
            >
              <Trash2 />
              Delete
            </ActionBarItem>
          </PermissionGate>
        </ActionBarGroup>
      </ActionBar>

      <ForceDeleteRoleDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        roles={selected}
        showTrigger={false}
        onSuccess={clearSelection}
      />
    </>
  );
}
