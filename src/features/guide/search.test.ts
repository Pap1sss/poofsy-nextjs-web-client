import { describe, expect, it } from "vitest";

import { routes } from "@/config/routes";

import { GUIDE_SEARCH_SUGGESTIONS, GUIDE_TOPICS } from "./content";
import { queryWords, searchGuide } from "./search";
import type { GuideTopic } from "./types";

const topics: GuideTopic[] = [
  {
    id: "income",
    title: "Managing Income",
    summary: "Payslips and sources.",
    sprite: "coin",
    entries: [
      {
        id: "payslip",
        title: "Record a payslip",
        level: "basics",
        blocks: [{ type: "steps", items: ["Add each deduction, such as PhilHealth."] }],
      },
      {
        id: "raise",
        title: "When your pay changes",
        level: "advanced",
        blocks: [{ type: "callout", tone: "tip", text: ["Use Change pay amount."] }],
      },
    ],
  },
  {
    id: "debts",
    title: "Debt Management",
    summary: "Owed to me and I owe.",
    sprite: "wallet",
    entries: [
      {
        id: "repay",
        title: "Record a repayment",
        level: "basics",
        blocks: [{ type: "terms", items: [{ term: "Back in my account", text: "Not income." }] }],
      },
    ],
  },
];

describe("searchGuide", () => {
  it("returns every topic and entry for an empty query", () => {
    const result = searchGuide(topics, "   ");
    expect(result.map((match) => match.entries.length)).toEqual([2, 1]);
  });

  it("finds words inside steps, callouts and terms", () => {
    expect(searchGuide(topics, "philhealth")[0].entries.map((e) => e.id)).toEqual(["payslip"]);
    expect(searchGuide(topics, "change pay")[0].entries.map((e) => e.id)).toEqual(["raise"]);
    expect(searchGuide(topics, "back in my account")[0].topic.id).toBe("debts");
  });

  it("needs every word to match, but words may come from the topic title", () => {
    expect(searchGuide(topics, "income deduction")[0].entries.map((e) => e.id)).toEqual([
      "payslip",
    ]);
    expect(searchGuide(topics, "philhealth debt")).toEqual([]);
  });

  it("ignores case, accents and hyphens", () => {
    expect(queryWords("  Pag-IBIG  Señor ")).toEqual(["pag", "ibig", "senor"]);
    expect(searchGuide(topics, "PHILHEALTH")).toHaveLength(1);
  });

  it("returns nothing when no entry matches", () => {
    expect(searchGuide(topics, "cryptocurrency")).toEqual([]);
  });
});

describe("guide content", () => {
  const topicIds = GUIDE_TOPICS.map((topic) => topic.id);
  const appRoutes = new Set(
    Object.values(routes).flatMap((value) =>
      typeof value === "string"
        ? [value]
        : Object.values(value).filter((v) => typeof v === "string")
    )
  );

  it("has unique topic ids and unique entry ids within each topic", () => {
    expect(new Set(topicIds).size).toBe(topicIds.length);
    for (const topic of GUIDE_TOPICS) {
      const ids = topic.entries.map((entry) => entry.id);
      expect(new Set(ids).size, topic.id).toBe(ids.length);
      expect(topic.entries.length, topic.id).toBeGreaterThan(0);
    }
  });

  it("only points related topics at other topics that exist", () => {
    for (const topic of GUIDE_TOPICS) {
      for (const id of topic.related ?? []) {
        expect(topicIds, `${topic.id} → ${id}`).toContain(id);
        expect(id).not.toBe(topic.id);
      }
    }
  });

  it("only suggests searches that find something", () => {
    for (const word of GUIDE_SEARCH_SUGGESTIONS) {
      expect(searchGuide(GUIDE_TOPICS, word).length, word).toBeGreaterThan(0);
    }
  });

  it("only links to app pages that exist", () => {
    for (const topic of GUIDE_TOPICS) {
      for (const link of topic.links ?? []) {
        expect(appRoutes.has(link.href), `${topic.id} → ${link.href}`).toBe(true);
      }
    }
  });
});
