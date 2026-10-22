import { Sprite } from "@/components/pixel/sprites";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIsoDate } from "@/features/income/dates";

/**
 * The upcoming paydays the API previewed, already moved by the weekend rule, as a menu list:
 * the next payday carries the ▶ cursor.
 */
export function PaydayList({ dates, isLoading }: { dates?: string[]; isLoading?: boolean }) {
  if (isLoading && !dates) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!dates?.length) return null;

  return (
    <ol aria-label="Next paydays" className="pixel-panel grid gap-1 p-3 sm:grid-cols-2">
      {dates.map((date, index) => (
        <li
          key={date}
          data-active={index === 0}
          aria-current={index === 0 ? "date" : undefined}
          className="menu-cursor flex items-center gap-3 py-1.5 pr-2 pl-5 data-[active=true]:bg-highlight data-[active=true]:text-highlight-foreground"
        >
          <Sprite name="calendar" size={18} />
          <span className="min-w-0">
            <span className="font-pixel block text-xs opacity-80">
              {index === 0 ? "Next payday" : formatIsoDate(date, { weekday: "long" })}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatIsoDate(date, { month: "short", day: "numeric", year: "numeric" })}
              {index === 0 && (
                <span className="font-normal">, {formatIsoDate(date, { weekday: "long" })}</span>
              )}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
