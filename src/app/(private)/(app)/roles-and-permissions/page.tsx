"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { buttonVariants } from "@/components/ui/button";
import Error from "@/components/Error";
import { rolePermissions, useFetchRoles } from "@/features/role-and-permission";
import RolesTable from "@/features/role-and-permission/components/table/roles-table";
import { routes } from "@/config/routes";
import { PermissionGate } from "@/features/auth";

const RolesPageContent = () => {
  const searchParams = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());
  const fetchRoles = useFetchRoles(searchParamsObj);

  let content;

  if (fetchRoles.isError) {
    content = <Error message={fetchRoles.error?.message} />;
  } else if (fetchRoles.isLoading || !fetchRoles.data) {
    content = (
      <DataTableSkeleton
        columnCount={7}
        filterCount={2}
        cellWidths={["10rem", "30rem", "10rem", "10rem", "6rem", "6rem", "6rem"]}
        shrinkZero
      />
    );
  } else {
    content = <RolesTable data={fetchRoles.data} />;
  }

  return (
    <>
      <div className="page-container space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl">Roles</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Roles and the permissions granted to each
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGate requireAll requiredPermissions={[rolePermissions.Create]} returnNull>
              <Link
                href={routes.roles_and_permissions.create}
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <Plus className="size-4" />
                Create Role
              </Link>
            </PermissionGate>
          </div>
        </div>

        {content}
      </div>
    </>
  );
};

export default function RolesPage() {
  return (
    <PermissionGate requiredPermissions={[rolePermissions.ViewAny]} displayAsNotFound requireAll>
      <RolesPageContent />
    </PermissionGate>
  );
}
