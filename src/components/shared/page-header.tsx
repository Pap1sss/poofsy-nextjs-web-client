import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils/component";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  /** Primary actions, right-aligned on wide screens and stacked below the title on phones. */
  actions?: React.ReactNode;
  /** A pixel sprite beside the title, like a menu screen's icon. */
  sprite?: SpriteName;
  className?: string;
};

/** Screen title in the pixel face over a chunky rule, like the top of an RPG menu screen. */
export function PageHeader({ title, description, actions, sprite, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-outline flex flex-col gap-4 border-b-4 border-double pb-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {sprite && <Sprite name={sprite} size={32} />}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 max-w-prose text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
