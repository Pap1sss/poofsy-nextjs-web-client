"use client";

import Link from "next/link";
import { ArrowUp, Check, ExternalLink } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/component";

import { entryKey } from "../content";
import type { GuideEntry, GuideLevel, GuideTopic } from "../types";
import { GuideBlocks } from "./guide-blocks";

export const LEVEL_LABEL: Record<GuideLevel, string> = { basics: "Basics", advanced: "Advanced" };

export function LevelBadge({ level }: { level: GuideLevel }) {
  return (
    <Badge variant={level === "basics" ? "success" : "secondary"} className="font-pixel">
      {LEVEL_LABEL[level]}
    </Badge>
  );
}

type GuideTopicSectionProps = {
  topic: GuideTopic;
  /** 1-based chapter number in the full guide (stays the same while searching). */
  chapter: number;
  /** The entries to show: all of them, or only the search matches. */
  entries: GuideEntry[];
  /** Open accordion entries, as entryKey() values. */
  open: string[];
  onOpenChange: (open: string[]) => void;
  understood: boolean;
  onUnderstoodChange: (value: boolean) => void;
  /** Related topic ids resolved to titles, for the "Read next" links. */
  related: { id: string; title: string }[];
  onBackToTop: () => void;
};

export function GuideTopicSection({
  topic,
  chapter,
  entries,
  open,
  onOpenChange,
  understood,
  onUnderstoodChange,
  related,
  onBackToTop,
}: GuideTopicSectionProps) {
  const headingId = `${topic.id}-heading`;

  return (
    <section
      id={topic.id}
      aria-labelledby={headingId}
      className="pixel-panel scroll-mt-24 space-y-4 p-4 sm:p-6 print:shadow-none"
    >
      <header className="flex items-start gap-3">
        <Sprite name={topic.sprite} size={36} className="mt-1" />
        <div className="min-w-0 flex-1">
          <p className="font-stat text-muted-foreground text-lg leading-none">
            Chapter {String(chapter).padStart(2, "0")}
          </p>
          <h2
            id={headingId}
            tabIndex={-1}
            className="font-pixel text-xl leading-tight outline-none sm:text-2xl"
          >
            {topic.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">{topic.summary}</p>
        </div>
        {understood && (
          <Badge variant="success" className="font-pixel shrink-0">
            <Check aria-hidden /> Understood
          </Badge>
        )}
      </header>

      <Accordion
        type="multiple"
        value={open}
        onValueChange={onOpenChange}
        className="border-outline/40 border-y-2"
      >
        {entries.map((entry) => {
          const key = entryKey(topic.id, entry.id);
          return (
            <AccordionItem key={key} value={key} className="border-outline/30 not-last:border-b-2">
              <AccordionTrigger className="menu-cursor items-center gap-3 rounded-none py-3 pl-4 hover:no-underline">
                <span className="font-pixel text-base">{entry.title}</span>
                <LevelBadge level={entry.level} />
              </AccordionTrigger>
              <AccordionContent className="pl-4 text-sm sm:text-base">
                <GuideBlocks blocks={entry.blocks} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {topic.links && topic.links.length > 0 && (
        <div className="space-y-2 print:hidden">
          <p className="font-pixel text-sm">Open in Poofsy</p>
          <div className="flex flex-wrap gap-2">
            {topic.links.map((link) => (
              <Button key={link.href} asChild variant="outline" size="sm">
                <Link href={link.href}>
                  {link.label}
                  <ExternalLink aria-hidden className="size-3.5" />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <nav aria-label={`Related to ${topic.title}`} className="space-y-2 print:hidden">
          <p className="font-pixel text-sm">Read next</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {related.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-primary text-sm underline underline-offset-4"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-outline/40 pt-4 print:hidden">
        <Button
          variant={understood ? "secondary" : "outline"}
          size="sm"
          aria-pressed={understood}
          onClick={() => onUnderstoodChange(!understood)}
        >
          <Check aria-hidden className={cn(!understood && "opacity-40")} />
          {understood ? "Marked as understood" : "Mark as understood"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onBackToTop}>
          <ArrowUp aria-hidden />
          Back to top
        </Button>
      </footer>
    </section>
  );
}
