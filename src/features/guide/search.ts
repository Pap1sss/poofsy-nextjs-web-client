import type { GuideBlock, GuideEntry, GuideTopic } from "./types";

export type GuideMatch = { topic: GuideTopic; entries: GuideEntry[] };

function blockText(block: GuideBlock): string {
  switch (block.type) {
    case "p":
      return block.text;
    case "steps":
    case "list":
      return block.items.join(" ");
    case "terms":
      return block.items.map((item) => `${item.term} ${item.text}`).join(" ");
    case "callout":
      return [block.title ?? "", ...[block.text].flat()].join(" ");
  }
}

// Folds case and accents so "peso" finds "Peso" and "pagibig" doesn't need the hyphen typed exactly.
function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-‐–—]/g, " ");
}

export function queryWords(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/**
 * Topics with the entries that match every word of the query, in guide order.
 * A word may match the topic's title or summary, the entry's title, or anything in its blocks.
 * An empty query returns every topic with all its entries.
 */
export function searchGuide(topics: GuideTopic[], query: string): GuideMatch[] {
  const words = queryWords(query);
  if (words.length === 0) return topics.map((topic) => ({ topic, entries: topic.entries }));

  return topics.flatMap((topic) => {
    const topicText = normalize(`${topic.title} ${topic.summary}`);
    const entries = topic.entries.filter((entry) => {
      const text = `${topicText} ${normalize(`${entry.title} ${entry.blocks.map(blockText).join(" ")}`)}`;
      return words.every((word) => text.includes(word));
    });
    return entries.length > 0 ? [{ topic, entries }] : [];
  });
}
