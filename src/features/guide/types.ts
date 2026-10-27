import type { SpriteName } from "@/components/pixel/sprites";

/**
 * The guide is plain data: topics hold accordion entries, entries hold blocks.
 * Keeping it out of JSX lets search read every word and keeps each topic in its own file.
 */
export type GuideBlock =
  | { type: "p"; text: string }
  /** Numbered how-to steps. */
  | { type: "steps"; items: string[] }
  | { type: "list"; items: string[] }
  /** Term → meaning pairs, for vocabulary like "Total money" vs "Left to spend". */
  | { type: "terms"; items: { term: string; text: string }[] }
  /** tip = a friendly hint, warning = something that can go wrong, example = a worked example. */
  | {
      type: "callout";
      tone: "tip" | "warning" | "example";
      title?: string;
      text: string | string[];
    };

/** basics = start here; advanced = for once you know your way around. */
export type GuideLevel = "basics" | "advanced";

export type GuideEntry = {
  id: string;
  title: string;
  level: GuideLevel;
  blocks: GuideBlock[];
};

export type GuideLink = { label: string; href: string };

export type GuideTopic = {
  /** Also the page anchor: /help#<id>. */
  id: string;
  title: string;
  /** One line under the title; also searched. */
  summary: string;
  sprite: SpriteName;
  entries: GuideEntry[];
  /** App pages this topic is about. Only routes that exist. */
  links?: GuideLink[];
  /** Other topic ids worth reading next. */
  related?: string[];
};
