"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TabLinkSchema } from "@/lib/schemas";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { segmentClass, segmentListClass } from "@/components/ui/segments";

/**
 * Page-level navigation drawn like tabs. These are links between routes, not tab panels,
 * so they're a nav with aria-current rather than an ARIA tablist (which needs panels).
 */
export default function TabLinks({
  tabLinks,
  resourceId,
}: {
  tabLinks: TabLinkSchema[];
  resourceId: string;
}) {
  const pathname = usePathname();

  return (
    <ScrollArea className="whitespace-nowrap">
      <nav aria-label="Section" className={segmentListClass}>
        {tabLinks.map((tab) => {
          const url = typeof tab.url === "function" ? tab.url(resourceId) : tab.url;

          return (
            <Link
              key={tab.title}
              href={url}
              aria-current={pathname === url ? "page" : undefined}
              className={segmentClass}
            >
              {tab.title}
            </Link>
          );
        })}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
