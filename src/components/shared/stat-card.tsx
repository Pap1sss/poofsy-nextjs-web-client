import type { LucideIcon } from "lucide-react";

import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils/component";

type StatCardProps = {
  label: string;
  /** Usually a <MoneyDisplay />. The value is the largest thing on the card. */
  value: React.ReactNode;
  /** One short line of context, e.g. "Expected, no income recorded yet". */
  hint?: React.ReactNode;
  icon?: LucideIcon;
  /** A pixel sprite instead of a line icon. */
  sprite?: SpriteName;
  className?: string;
};

/** A status-screen stat: pixel label, big readable figure, one line of context. */
export function StatCard({ label, value, hint, icon: Icon, sprite, className }: StatCardProps) {
  return (
    // Two to a row on phones, so the padding and figure are a step smaller there.
    <div className={cn("pixel-panel min-w-0 p-3.5 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-pixel text-muted-foreground text-xs sm:text-sm">{label}</span>
        {sprite ? (
          <Sprite name={sprite} size={20} />
        ) : (
          Icon && <Icon className="size-4" aria-hidden />
        )}
      </div>
      {/* A very large amount wraps rather than pushing past the card. */}
      <div className="font-stat mt-1 text-[1.75rem] leading-none [overflow-wrap:anywhere] sm:text-4xl">
        {value}
      </div>
      {hint && <div className="text-muted-foreground mt-1 text-xs sm:text-sm">{hint}</div>}
    </div>
  );
}
