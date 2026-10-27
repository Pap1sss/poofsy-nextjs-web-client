"use client";

import { Eye, EyeOff } from "lucide-react";

import { setHidden, useHidden, type PrivacyArea } from "@/lib/privacy";
import { cn } from "@/lib/utils/component";

/**
 * The eye that flips an area's privacy switch (lib/privacy.ts), e.g. when someone can see your
 * screen. `what` names the amounts it hides, for the label: "Hide total", "Show balances".
 */
export function HideAmountsButton({
  area,
  what,
  className,
}: {
  area: PrivacyArea;
  what: string;
  className?: string;
}) {
  const hidden = useHidden(area);
  const label = `${hidden ? "Show" : "Hide"} ${what}`;

  return (
    <button
      type="button"
      onClick={() => setHidden(area, !hidden)}
      aria-pressed={hidden}
      aria-label={label}
      title={label}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-highlight flex size-11 items-center justify-center outline-none focus-visible:outline-3",
        className
      )}
    >
      {hidden ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
    </button>
  );
}
