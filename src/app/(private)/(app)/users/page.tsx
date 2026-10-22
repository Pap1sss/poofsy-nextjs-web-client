"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Download, Plus } from "lucide-react";

import Error from "@/components/Error";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import UsersTable from "@/features/user/components/table/users-table";
import { PermissionGate } from "@/features/auth";
import { userPermissions, useFetchUsers, useExportUsers, useImportUsers } from "@/features/user";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "@/components/import-dialog";
import { routes } from "@/config/routes";
import { userApiClient } from "@/features/user/api";

const UsersPageContent = () => {
  const searchParams = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());
  const fetchUsers = useFetchUsers(searchParamsObj);
  const exportUsers = useExportUsers();
  const importUsers = useImportUsers();

  const handleExport = () => {
    exportUsers.mutate(undefined, {
      onSuccess: ({ message }) => toast.success(message),
      onError: ({ message }) => toast.error(message),
    });
  };

  if (fetchUsers.data?.success) {
    return (
      <div className="page-container space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl">Users</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Every account, with the roles assigned to each
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGate requiredPermissions={[userPermissions.Export]} requireAll returnNull>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exportUsers.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PermissionGate>

            <PermissionGate requiredPermissions={[userPermissions.Import]} requireAll returnNull>
              <ImportDialog
                resourceName="users"
                onImport={(file) => importUsers.mutateAsync(file)}
                onDownloadTemplate={userApiClient.downloadImportTemplate}
                templateHint="Keep the header row and replace the example rows with your users."
              />
            </PermissionGate>

            <PermissionGate requiredPermissions={[userPermissions.Create]} requireAll returnNull>
              <Button asChild size="sm">
                <Link href={routes.users.create}>
                  <Plus className="size-4" />
                  Create User
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </div>
        <UsersTable data={fetchUsers.data} />
      </div>
    );
  }

  if (fetchUsers.isError) {
    return <Error message={fetchUsers.error.message} />;
  }

  return (
    <DataTableSkeleton
      columnCount={7}
      filterCount={2}
      cellWidths={["10rem", "30rem", "10rem", "10rem", "6rem", "6rem", "6rem"]}
      shrinkZero
    />
  );
};

export default function UsersPage() {
  return (
    <PermissionGate requiredPermissions={[userPermissions.ViewAny]} displayAsNotFound requireAll>
      <UsersPageContent />
    </PermissionGate>
  );
}
