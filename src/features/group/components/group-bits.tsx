"use client";

import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { isZero, type Money } from "@/lib/money";
import { cn } from "@/lib/utils/component";

import { GROUP_ICONS } from "../constant";
import type { Participant } from "../schema";

export { longDate } from "@/features/debt/components/debt-bits";

// Same RPG-menu list as Debts and Bills: framed panel, dashed dividers between rows.
export const ROW_LIST = "pixel-panel divide-border divide-y-2 divide-dashed px-1 py-1";

const iconOf = (icon: string | null): SpriteName =>
  (GROUP_ICONS as readonly string[]).includes(icon ?? "") ? (icon as SpriteName) : "bag";

/** The group's pixel badge: its sprite on its colour (a user choice, like a category colour). */
export function GroupAvatar({
  color,
  icon,
  size = 44,
  className,
}: {
  color: string | null;
  icon: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pixel-box bg-muted inline-flex shrink-0 items-center justify-center",
        className
      )}
      style={{ width: size, height: size, ...(color ? { backgroundColor: color } : {}) }}
    >
      <Sprite name={iconOf(icon)} size={Math.round(size * 0.6)} />
    </span>
  );
}

const STANDING = {
  owed: { label: "Gets back", className: "text-income" },
  owes: { label: "Owes", className: "text-expense" },
  settled: { label: "Settled", className: "text-muted-foreground" },
} as const;

/** Words carry the meaning too, not just colour. */
export function StandingBadge({
  standing,
  className,
}: {
  standing: Participant["standing"];
  className?: string;
}) {
  const style = STANDING[standing];

  return (
    <span
      className={cn(
        "font-pixel border-outline bg-card inline-flex items-center gap-1 border-2 px-1.5 py-0.5 text-xs",
        style.className,
        className
      )}
    >
      {standing === "settled" && <Sprite name="check" size={12} />}
      {style.label}
    </span>
  );
}

/** A participant's net balance with its meaning in words: "gets back ₱750" / "owes ₱250" / "settled". */
export function NetAmount({ net, className }: { net: Money; className?: string }) {
  if (isZero(net)) {
    return <span className={cn("text-muted-foreground", className)}>Settled</span>;
  }

  const owes = net.amount.startsWith("-");

  return (
    <span className={className}>
      <span className="text-muted-foreground font-sans text-xs">
        {owes ? "owes " : "gets back "}
      </span>
      <MoneyDisplay
        value={{ ...net, amount: owes ? net.amount.slice(1) : net.amount }}
        tone={owes ? "expense" : "income"}
      />
    </span>
  );
}

const NOTCHES = "repeating-linear-gradient(90deg, transparent 0 10px, rgb(0 0 0 / 0.2) 10px 12px)";

/** How much of what had to change hands has been settled, as an HP-style bar. The percentage comes from the API. */
export function SettleProgress({
  percent,
  label,
  className,
}: {
  percent: number | null;
  label: string;
  className?: string;
}) {
  if (percent === null) {
    return <p className={cn("text-muted-foreground text-xs", className)}>Nothing to settle yet</p>;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={`${label} settled`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${percent}% settled`}
        className="hp-track h-3 flex-1 overflow-hidden"
      >
        <div
          className="bg-hp-ok h-full transition-[width] duration-300 ease-[steps(6)] motion-reduce:transition-none"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundImage: NOTCHES }}
        />
      </div>
      <span className="font-pixel w-12 shrink-0 text-right text-xs tabular-nums">{percent}%</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: "active" | "completed" }) {
  return (
    <span
      className={cn(
        "font-pixel border-outline inline-flex items-center gap-1 border-2 px-1.5 py-0.5 text-xs",
        status === "completed" ? "text-income" : "text-foreground"
      )}
    >
      {status === "completed" && <Sprite name="check" size={12} />}
      {status === "completed" ? "Completed" : "Active"}
    </span>
  );
}
