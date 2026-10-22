import { cn } from "@/lib/utils/component";

// Notches every few pixels, like a handheld status bar (same look as BudgetProgress).
const NOTCHES = "repeating-linear-gradient(90deg, transparent 0 10px, rgb(0 0 0 / 0.2) 10px 12px)";

/**
 * Quest progress as an HP-style bar: dark outlined track, notched fill, with the percentage written
 * beside it so the value never rests on colour alone. The percentage comes from the API.
 */
export function GoalProgress({
  percent,
  label,
  className,
}: {
  percent: number | null;
  /** What the meter measures, for screen readers: "New laptop". */
  label: string;
  className?: string;
}) {
  const value = percent ?? 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent === null ? undefined : Math.round(value)}
        aria-valuetext={percent === null ? "No target yet" : `${value}% saved`}
        className="hp-track h-4 flex-1 overflow-hidden"
      >
        <div
          className="bg-hp-ok h-full transition-[width] duration-300 ease-[steps(6)] motion-reduce:transition-none"
          style={{ width: `${Math.min(value, 100)}%`, backgroundImage: NOTCHES }}
        />
      </div>
      <span className="font-pixel w-12 shrink-0 text-right text-sm tabular-nums">
        {percent === null ? "—" : `${value}%`}
      </span>
    </div>
  );
}
