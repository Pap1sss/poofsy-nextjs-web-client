import { Sprite, type SpriteName } from "@/components/pixel/sprites";
import { cn } from "@/lib/utils/component";

import type { GuideBlock } from "../types";

// Each callout reads like a dialogue box: who's talking (sprite + label) sets the tone, not colour alone.
const CALLOUT: Record<
  "tip" | "warning" | "example",
  { sprite: SpriteName; label: string; className: string }
> = {
  tip: { sprite: "mascot", label: "Tip", className: "bg-card" },
  warning: { sprite: "alert", label: "Watch out", className: "bg-card border-warning" },
  example: { sprite: "scroll", label: "Example", className: "bg-muted/60" },
};

function Callout({ block }: { block: Extract<GuideBlock, { type: "callout" }> }) {
  const tone = CALLOUT[block.tone];
  const lines = [block.text].flat();

  return (
    <aside
      aria-label={block.title ?? tone.label}
      className={cn("pixel-box flex gap-3 px-3 py-3 break-inside-avoid", tone.className)}
    >
      <Sprite name={tone.sprite} size={28} className="mt-0.5" />
      <div className="min-w-0 space-y-1.5">
        <p className={cn("font-pixel text-sm", block.tone === "warning" && "text-warning")}>
          {tone.label}
          {block.title ? `: ${block.title}` : ""}
        </p>
        {lines.map((line) => (
          <p key={line} className="text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </aside>
  );
}

export function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "p":
            return (
              <p key={key} className="leading-relaxed">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={key} className="list-['▸_'] space-y-1 pl-5 leading-relaxed">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={key} className="space-y-2">
                {block.items.map((item, step) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span
                      aria-hidden
                      className="pixel-box bg-highlight text-highlight-foreground font-stat flex size-7 shrink-0 items-center justify-center text-lg leading-none"
                    >
                      {step + 1}
                    </span>
                    <span className="pt-0.5">
                      <span className="sr-only">Step {step + 1}: </span>
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "terms":
            return (
              <dl key={key} className="divide-outline/30 divide-y-2 border-y-2 border-outline/30">
                {block.items.map((item) => (
                  <div
                    key={item.term}
                    className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr] sm:gap-4"
                  >
                    <dt className="font-pixel text-sm">{item.term}</dt>
                    <dd className="leading-relaxed">{item.text}</dd>
                  </div>
                ))}
              </dl>
            );
          case "callout":
            return <Callout key={key} block={block} />;
        }
      })}
    </div>
  );
}
