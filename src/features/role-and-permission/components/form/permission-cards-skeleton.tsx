import { Skeleton } from "@/components/ui/skeleton";

export default function PermissionCardsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-56" />
      <div className="overflow-hidden rounded-lg border">
        {[1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="grid gap-4 border-b px-4 py-4 last:border-b-0 md:grid-cols-[14rem_repeat(4,minmax(0,1fr))]"
          >
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
