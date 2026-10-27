"use client";

import { Check } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/component";

import type { GuideTopic } from "../types";

type GuideNavProps = {
  topics: GuideTopic[];
  /** The topic currently on screen. */
  activeId: string | null;
  understood: string[];
  onJump: (id: string) => void;
};

/** Chapter list for wide screens: the handheld-menu look, with the ▶ cursor on the topic in view. */
export function GuideMenu({ topics, activeId, understood, onJump }: GuideNavProps) {
  return (
    <nav aria-label="Guide topics" className="pixel-panel p-2">
      <p className="font-pixel text-muted-foreground px-3 pt-1 pb-2 text-xs uppercase">Chapters</p>
      <ol className="space-y-0.5">
        {topics.map((topic) => {
          const active = topic.id === activeId;
          return (
            <li key={topic.id}>
              <a
                href={`#${topic.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  onJump(topic.id);
                }}
                data-active={active}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "menu-cursor flex min-h-9 items-center gap-2 py-1.5 pr-2 pl-4 text-sm outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-highlight",
                  active ? "bg-highlight text-highlight-foreground" : "hover:bg-accent"
                )}
              >
                <Sprite name={topic.sprite} size={16} />
                <span className="font-pixel min-w-0 flex-1 truncate">{topic.title}</span>
                {understood.includes(topic.id) && (
                  <Check aria-label="Understood" className="text-income size-4 shrink-0" />
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Phones and tablets: one picker instead of a long list. */
export function GuideJumpSelect({ topics, activeId, onJump }: Omit<GuideNavProps, "understood">) {
  return (
    <Select value={activeId ?? undefined} onValueChange={onJump}>
      <SelectTrigger aria-label="Jump to a topic" className="w-full">
        <SelectValue placeholder="Jump to a topic" />
      </SelectTrigger>
      <SelectContent>
        {topics.map((topic, index) => (
          <SelectItem key={topic.id} value={topic.id}>
            {String(index + 1).padStart(2, "0")} · {topic.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
