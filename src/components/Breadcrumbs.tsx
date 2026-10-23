"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useBreadcrumbTitle } from "@/lib/hooks/useBreadcrumbTitle";

// Only segments whose label or link differs from the title-cased segment need
// an entry; everything else falls back to titleCase().
const SEGMENT_MAP: Record<string, { label: string; href: string }> = {
  dashboard: { label: "Dashboard", href: routes.dashboard.home },
  notifications: { label: "Notifications", href: routes.notifications.list },
  profile: { label: "Profile", href: routes.profile },
  // /debts/people has no page of its own; people are listed on the Debts page.
  people: { label: "People", href: routes.debts.home },
  // /paylater/purchases and /paylater/providers have no pages of their own; both live on the PayLater page.
  paylater: { label: "PayLater", href: routes.paylater.home },
  purchases: { label: "Purchases", href: routes.paylater.home },
  providers: { label: "Providers", href: routes.paylater.home },
  "roles-and-permissions": {
    label: "Roles & Permissions",
    href: routes.roles_and_permissions.list,
  },
};

// Ids are not words. Title-casing a UUID produced breadcrumbs like
// "01a0aa65 D1fa 724f Aae8 B5ac690b88cd"; detail pages publish their real name
// through useSetBreadcrumbTitle instead, and this is how we know to use it.
function looksLikeId(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || /^\d+$/.test(segment);
}

// Title-case a URL segment: "system-activities" -> "System Activities".
// Only used when SEGMENT_MAP has nothing for the segment.
function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function getSegment(segment: string, fallbackHref: string) {
  const mapped = SEGMENT_MAP[segment];
  return {
    label: mapped?.label ?? titleCase(segment),
    href: mapped?.href ?? fallbackHref,
  };
}

export default function Breadcrumbs() {
  const paths = usePathname();
  const publishedTitle = useBreadcrumbTitle();
  const pathNames = paths.split("/").filter((path) => path);

  const middleItems = pathNames.length > 2 ? pathNames.slice(0, -2) : [];
  const lastTwoItems = pathNames.slice(-2);

  return (
    // Pixel face with ▸ separators, like a menu path.
    <Breadcrumb className="font-pixel">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={routes.dashboard.home}>Home</BreadcrumbLink>
        </BreadcrumbItem>

        {middleItems.length > 0 && (
          <>
            <BreadcrumbSeparator>
              <span aria-hidden>▸</span>
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <BreadcrumbEllipsis />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middleItems.map((item, index) => {
                    const fallback = "/" + pathNames.slice(0, index + 1).join("/");
                    const { label, href } = getSegment(item, fallback);
                    return (
                      <DropdownMenuItem key={index}>
                        <BreadcrumbLink asChild>
                          <Link href={href}>{label}</Link>
                        </BreadcrumbLink>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}

        {lastTwoItems.map((item, index) => {
          const isLast = index === lastTwoItems.length - 1;
          const itemIndex = pathNames.length - lastTwoItems.length + index;
          const fallback = "/" + pathNames.slice(0, itemIndex + 1).join("/");
          const segment = getSegment(item, fallback);
          // A detail page's own name beats title-casing its id. Not only when
          // the id is last: /users/{id}/details puts it second-to-last, and
          // these routes never carry more than one id.
          const label = looksLikeId(item) ? (publishedTitle ?? "Details") : segment.label;
          const href = segment.href;

          return (
            <Fragment key={index}>
              <BreadcrumbSeparator>
                <span aria-hidden>▸</span>
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="max-w-14 md:max-w-40 truncate">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="max-w-14 md:max-w-40 truncate">
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
