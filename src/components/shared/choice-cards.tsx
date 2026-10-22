"use client";

import { RadioGroup } from "radix-ui";

import { cn } from "@/lib/utils/component";

type Choice<T extends string> = { value: T; label: string; description?: string };

type ChoiceCardsProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  choices: readonly Choice<T>[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

/** A radio group drawn as selectable tiles, for a few mutually exclusive options that need a sentence each. */
export function ChoiceCards<T extends string>({
  value,
  onValueChange,
  choices,
  className,
  ...aria
}: ChoiceCardsProps<T>) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      className={cn("grid gap-2 sm:grid-cols-2", className)}
      {...aria}
    >
      {choices.map((choice) => (
        <RadioGroup.Item
          key={choice.value}
          value={choice.value}
          className={cn(
            // Menu options: outlined pixel boxes; the chosen one takes the cursor-yellow highlight.
            "pixel-box group flex min-h-11 cursor-pointer flex-col items-start gap-0.5 bg-card px-4 py-3 text-left",
            "hover:bg-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-highlight",
            "data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground"
          )}
        >
          <span className="font-pixel flex w-full items-center justify-between gap-3 text-sm">
            {choice.label}
            <span
              aria-hidden
              className="border-outline size-4 shrink-0 border-2 bg-card group-data-[state=checked]:bg-outline group-data-[state=checked]:shadow-[inset_0_0_0_2px_var(--card)]"
            />
          </span>
          {choice.description && <span className="text-sm opacity-80">{choice.description}</span>}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
