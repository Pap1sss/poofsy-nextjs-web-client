import type { LucideIcon } from "lucide-react";

import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils/component";

type EmptyStateProps = {
  /** Kept for callers that pass a line icon; the pixel sprite is shown instead when given. */
  icon?: LucideIcon;
  /** Defaults to Poof, the mascot. */
  sprite?: SpriteName;
  title: string;
  /** Say what to do next, not how empty it is. */
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

/** Poof pops up with a speech line saying what to do next. */
export function EmptyState({
  sprite = "mascot",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 border-2 border-dashed border-outline/40 px-6 py-10 text-center",
        className
      )}
    >
      <Sprite name={sprite} size={40} />
      <div className="pixel-box bg-card max-w-sm space-y-1 px-4 py-3">
        <p className="font-pixel text-base">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
