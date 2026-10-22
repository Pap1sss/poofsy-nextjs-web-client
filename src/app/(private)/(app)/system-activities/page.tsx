"use client";

import { useSearchParams } from "next/navigation";

import Error from "@/components/Error";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { PermissionGate } from "@/features/auth";
import {
  SystemActivitiesTable,
  useFetchSystemActivityList,
  systemActivityPermissions,
} from "@/features/system-activity";

const SystemActivitiesPageContent = () => {
  const searchParams = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());
  const fetchSystemActivities = useFetchSystemActivityList(searchParamsObj);

  if (fetchSystemActivities.data?.success) {
    return <SystemActivitiesTable data={fetchSystemActivities.data} />;
  }

  if (fetchSystemActivities.isError) {
    return <Error message={fetchSystemActivities.error.message} />;
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

export default function SystemActivitiesPage() {
  return (
    <PermissionGate
      requiredPermissions={[systemActivityPermissions.ViewAny]}
      displayAsNotFound
      requireAll
    >
      <div className="page-container space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl">System Activities</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Audit log of every action taken across the app
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SystemActivitiesPageContent />
        </div>
      </div>
    </PermissionGate>
  );
}
