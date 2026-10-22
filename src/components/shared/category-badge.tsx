import { cn } from "@/lib/utils/component";

type CategoryBadgeProps = {
  name: string;
  /** The category's own colour, from the API (user-chosen hex). */
  color?: string | null;
  archived?: boolean;
  className?: string;
};

/** A category name with its colour dot. The text stays readable; only the dot carries the colour. */
export function CategoryBadge({ name, color, archived = false, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "font-pixel border-outline bg-card inline-flex max-w-full items-center gap-1.5 border-2 px-2 py-0.5 text-xs",
        archived && "text-muted-foreground border-dashed",
        className
      )}
    >
      <span
        aria-hidden
        className="border-outline size-2.5 shrink-0 border"
        style={{ backgroundColor: color ?? "var(--muted-foreground)" }}
      />
      <span className="truncate">{name}</span>
      {archived && <span className="sr-only">(archived)</span>}
    </span>
  );
}
