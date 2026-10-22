import { ChartNoAxesColumn } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/component";

type ChartCardProps = {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  /** What to do when there's no data yet, e.g. "Record an expense to see where your money goes." */
  emptyMessage?: string;
  /** Fixed height so loading, empty and loaded states don't shift the layout. */
  height?: number;
  children: React.ReactNode;
  className?: string;
};

/** Frame for every chart: one place that handles loading, error and empty states (plan §6). */
export function ChartCard({
  title,
  description,
  isLoading,
  error,
  isEmpty,
  emptyMessage = "Nothing to show for this period yet.",
  height = 280,
  children,
  className,
}: ChartCardProps) {
  return (
    <section className={cn("pixel-panel p-5", className)}>
      <header className="mb-4">
        <h2 className="text-lg">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </header>
      <div style={{ height }} className="relative">
        {isLoading ? (
          <Skeleton className="size-full" />
        ) : error ? (
          <p
            role="alert"
            className="text-expense flex size-full items-center justify-center text-center text-sm"
          >
            Couldn&apos;t load this chart: {error.message}
          </p>
        ) : isEmpty ? (
          <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 text-center text-sm">
            <ChartNoAxesColumn className="size-5" aria-hidden />
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
