"use client";

import { useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";

import { ChartCard } from "@/components/shared/chart-card";
import { segmentClass, segmentListClass } from "@/components/ui/segments";
import { cn } from "@/lib/utils/component";

type ReportSectionProps = {
  title: string;
  description: string;
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  emptyMessage: string;
  height?: number;
  chart: React.ReactNode;
  /** The same numbers as an accessible table; every chart has one. */
  table: React.ReactNode;
  /** Optional content under the card (e.g. net per month), shown with the chart view. */
  footer?: React.ReactNode;
  className?: string;
};

/** ChartCard plus a chart/table switch, so every report can be read without the picture. */
export function ReportSection({
  title,
  description,
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  height = 300,
  chart,
  table,
  footer,
  className,
}: ReportSectionProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <ChartCard
        title={title}
        description={description}
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        emptyMessage={emptyMessage}
        height={height}
      >
        <div className="flex h-full flex-col">
          {/* Pixel tab bar: chart or the same numbers as a table. */}
          <div className="-mt-2 mb-2 flex justify-end">
            <div role="group" aria-label={`${title} view`} className={segmentListClass}>
              <button
                type="button"
                className={cn(segmentClass, "gap-1.5")}
                aria-pressed={!showTable}
                onClick={() => setShowTable(false)}
              >
                <ChartColumn className="size-4" aria-hidden />
                Chart
              </button>
              <button
                type="button"
                className={cn(segmentClass, "gap-1.5")}
                aria-pressed={showTable}
                onClick={() => setShowTable(true)}
              >
                <Table2 className="size-4" aria-hidden />
                Table
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            {showTable ? <div className="h-full overflow-auto">{table}</div> : chart}
          </div>
        </div>
      </ChartCard>
      {footer && !isLoading && !error && !isEmpty && footer}
    </div>
  );
}

/** Plain, accessible table used by every report's table view. */
export function ReportTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-card sticky top-0">
        <tr className="border-outline border-b-2">
          {headers.map((header, index) => (
            <th
              key={header}
              scope="col"
              className={cn(
                "font-pixel text-muted-foreground py-2 font-normal",
                index === 0 ? "pr-3 text-left" : "px-3 text-right"
              )}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b last:border-0">
            {row.cells.map((cell, index) =>
              index === 0 ? (
                <th key={index} scope="row" className="py-2 pr-3 text-left font-normal">
                  {cell}
                </th>
              ) : (
                <td key={index} className="px-3 py-2 text-right tabular-nums">
                  {cell}
                </td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
