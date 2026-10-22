import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils/component";

import type { BillStatus } from "../schema";

// Status always pairs a pixel icon with a word; color only reinforces it (dataviz status rule).
export const BILL_STATUS: Record<
  BillStatus,
  { label: string; sprite: SpriteName; className: string }
> = {
  upcoming: { label: "Due", sprite: "house", className: "text-muted-foreground" },
  overdue: { label: "Overdue", sprite: "alert", className: "text-expense" },
  paid: { label: "Paid", sprite: "check", className: "text-income" },
  skipped: { label: "Skipped", sprite: "receipt", className: "text-muted-foreground" },
};

export function BillStatusLabel({ status, className }: { status: BillStatus; className?: string }) {
  const { label, sprite, className: tone } = BILL_STATUS[status];

  return (
    <span className={cn("font-pixel inline-flex items-center gap-1", tone, className)}>
      <Sprite name={sprite} size={12} />
      {label}
    </span>
  );
}
