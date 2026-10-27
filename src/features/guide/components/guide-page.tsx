"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Printer, RotateCcw, Search, X } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { GUIDE_SEARCH_SUGGESTIONS, GUIDE_TOPICS, entryKey } from "../content";
import { resetGuideProgress, setTopicUnderstood, useUnderstoodTopics } from "../progress";
import { searchGuide } from "../search";
import { GuideJumpSelect, GuideMenu } from "./guide-nav";
import { GuideTopicSection, LevelBadge } from "./guide-topic";

const TITLES = new Map(GUIDE_TOPICS.map((topic) => [topic.id, topic.title]));
const CHAPTER = new Map(GUIDE_TOPICS.map((topic, index) => [topic.id, index + 1]));
const ALL_ENTRY_KEYS = GUIDE_TOPICS.flatMap((topic) =>
  topic.entries.map((entry) => entryKey(topic.id, entry.id))
);
const ALL_TOPICS = searchGuide(GUIDE_TOPICS, "");

/** The topic nearest the top of the screen, for the chapter menu's cursor. */
function useTopicInView(ids: string[]): [string | null, (id: string) => void] {
  const [active, setActive] = React.useState<string | null>(ids[0] ?? null);

  React.useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) visible.add(record.target.id);
          else visible.delete(record.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      // A band just under the sticky header: whichever section crosses it is "in view".
      { rootMargin: "-96px 0px -65% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  // A search can hide the remembered topic; fall back to the first one still shown.
  return [active !== null && ids.includes(active) ? active : (ids[0] ?? null), setActive];
}

export default function GuidePage() {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<string[]>([]);
  const [printing, setPrinting] = React.useState(false);
  const [pendingJump, setPendingJump] = React.useState<string | null>(null);
  const understood = useUnderstoodTopics();
  const searchRef = React.useRef<HTMLInputElement>(null);

  const matches = React.useMemo(() => searchGuide(GUIDE_TOPICS, query), [query]);
  const shownIds = React.useMemo(() => matches.map((match) => match.topic.id), [matches]);
  const [activeId, setActiveId] = useTopicInView(shownIds);
  const searching = query.trim() !== "";
  const resultCount = matches.reduce((sum, match) => sum + match.entries.length, 0);
  // Paper always gets the whole guide, whatever is being searched.
  const visible = printing ? ALL_TOPICS : matches;
  const understoodCount = GUIDE_TOPICS.filter((topic) => understood.includes(topic.id)).length;

  // Searching opens every matching entry, so the answer is on screen without another click.
  const changeQuery = (next: string) => {
    setQuery(next);
    setOpen(
      next.trim() === ""
        ? []
        : searchGuide(GUIDE_TOPICS, next).flatMap((match) =>
            match.entries.map((entry) => entryKey(match.topic.id, entry.id))
          )
    );
  };

  const scrollToTopic = React.useCallback(
    (id: string) => {
      const section = document.getElementById(id);
      if (!section) return;
      section.scrollIntoView({ block: "start" });
      history.replaceState(null, "", `#${id}`);
      setActiveId(id);
      // Move focus with the view, so keyboard and screen-reader users land in the topic too.
      section.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    },
    [setActiveId]
  );

  // A topic hidden by the search: clear the search first, then jump once it's rendered.
  const jump = (id: string) => {
    if (shownIds.includes(id)) scrollToTopic(id);
    else {
      changeQuery("");
      setPendingJump(id);
    }
  };

  React.useEffect(() => {
    if (!pendingJump) return;
    scrollToTopic(pendingJump);
    setPendingJump(null);
  }, [pendingJump, scrollToTopic]);

  // Opening /help#budgets lands on that topic.
  React.useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && TITLES.has(id)) scrollToTopic(id);
  }, [scrollToTopic]);

  // Printing (the button or Ctrl+P) expands every entry first, so the paper copy is complete.
  React.useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const backToTop = () => {
    window.scrollTo({ top: 0 });
    searchRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="How It Works"
        sprite="scroll"
        description="Poofsy's built-in manual: how each page works, what every figure means, and what to do when something looks off."
        actions={
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer aria-hidden />
            Print guide
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden lg:block print:hidden">
          <div className="sticky top-20 max-h-[calc(100svh-6rem)] space-y-4 overflow-y-auto pb-2">
            <GuideMenu
              topics={GUIDE_TOPICS}
              activeId={activeId}
              understood={understood}
              onJump={jump}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] print:hidden">
            <div className="pixel-panel space-y-3 p-4">
              <label htmlFor="guide-search" className="font-pixel text-sm">
                Search the guide
              </label>
              <div className="relative">
                <Search
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  id="guide-search"
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => changeQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && query) {
                      event.preventDefault();
                      changeQuery("");
                    }
                  }}
                  placeholder="e.g. rollover, transfer, installment"
                  className="pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
                  autoComplete="off"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Clear search"
                    onClick={() => {
                      changeQuery("");
                      searchRef.current?.focus();
                    }}
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                  >
                    <X aria-hidden />
                  </Button>
                )}
              </div>
              <p aria-live="polite" className="text-muted-foreground text-xs">
                {searching
                  ? `${resultCount} ${resultCount === 1 ? "answer" : "answers"} in ${matches.length} ${matches.length === 1 ? "topic" : "topics"}`
                  : `${GUIDE_TOPICS.length} topics. Searches titles, steps, tips and FAQs.`}
              </p>
              <div className="lg:hidden">
                <GuideJumpSelect topics={GUIDE_TOPICS} activeId={activeId} onJump={jump} />
              </div>
            </div>

            <div className="pixel-panel flex flex-col justify-between gap-3 p-4 md:w-64">
              <div className="space-y-2">
                <p className="font-pixel text-sm">Your progress</p>
                <p className="font-stat text-3xl leading-none">
                  {understoodCount}
                  <span className="text-muted-foreground text-xl"> / {GUIDE_TOPICS.length}</span>
                </p>
                <div
                  role="progressbar"
                  aria-label="Topics marked as understood"
                  aria-valuemin={0}
                  aria-valuemax={GUIDE_TOPICS.length}
                  aria-valuenow={understoodCount}
                  className="hp-track h-4"
                >
                  <div
                    className="bg-hp-ok h-full"
                    style={{ width: `${(understoodCount / GUIDE_TOPICS.length) * 100}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Topics marked as understood. Saved in this browser only.
                </p>
              </div>
              {understoodCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={resetGuideProgress}
                >
                  <RotateCcw aria-hidden />
                  Start over
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs print:hidden">
            <span className="font-pixel text-muted-foreground">Key:</span>
            <span className="flex items-center gap-1.5">
              <LevelBadge level="basics" /> start here
            </span>
            <span className="flex items-center gap-1.5">
              <LevelBadge level="advanced" /> once you know your way around
            </span>
            <span className="flex items-center gap-1.5">
              <Sprite name="mascot" size={16} /> Tip
            </span>
            <span className="flex items-center gap-1.5">
              <Sprite name="alert" size={16} /> Watch out
            </span>
            <span className="flex items-center gap-1.5">
              <Sprite name="scroll" size={16} /> Example
            </span>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={`Nothing in the guide matches "${query.trim()}"`}
              description="Try fewer words, or a word from the menu or a page title. Some ideas:"
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {GUIDE_SEARCH_SUGGESTIONS.map((word) => (
                    <Button
                      key={word}
                      variant="outline"
                      size="sm"
                      onClick={() => changeQuery(word)}
                    >
                      {word}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => changeQuery("")}>
                    Show the whole guide
                  </Button>
                </div>
              }
            />
          ) : (
            visible.map(({ topic, entries }) => (
              <GuideTopicSection
                key={topic.id}
                topic={topic}
                chapter={CHAPTER.get(topic.id) ?? 0}
                entries={entries}
                open={printing ? ALL_ENTRY_KEYS : open}
                onOpenChange={(next) =>
                  setOpen((current) => [
                    // Keep other topics' open entries; replace this topic's.
                    ...current.filter((key) => !key.startsWith(`${topic.id}/`)),
                    ...next,
                  ])
                }
                understood={understood.includes(topic.id)}
                onUnderstoodChange={(value) => setTopicUnderstood(topic.id, value)}
                related={(topic.related ?? [])
                  .filter((id) => TITLES.has(id))
                  .map((id) => ({ id, title: TITLES.get(id)! }))}
                onBackToTop={backToTop}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
