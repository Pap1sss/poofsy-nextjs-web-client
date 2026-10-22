"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { DateRangePicker, type DateRange } from "@/components/shared/date-range-picker";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/features/auth";

import { reportPresets } from "../format";

// Recharts is the heavy part; the header and range filter render without waiting for it.
const ReportSections = dynamic(() => import("./report-sections"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-96" />
      ))}
    </div>
  ),
});

export default function ReportsPage() {
  const { timezone } = useUserSettings();
  const presets = useMemo(() => reportPresets(timezone), [timezone]);
  // Default: last 6 months, the same window the API uses when no range is given.
  const [range, setRange] = useState<DateRange>(() => presets[1]);

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Reports"
        sprite="chart"
        description="How your money moved over time. Transfers between your own accounts never count as income or spending."
        actions={<DateRangePicker value={range} onChange={setRange} presets={presets} />}
      />
      <ReportSections range={range} />
    </div>
  );
}
