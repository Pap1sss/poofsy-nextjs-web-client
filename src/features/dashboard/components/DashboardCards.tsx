"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NAV_GROUP, navigation, type NavItem } from "@/config/routes";
import { useAuth } from "@/features/auth";
import { filterNavByPermissions } from "@/lib/utils/nav";

const MODULE_GROUPS = NAV_GROUP.options.filter((g) => g !== "Dashboard");

/** One card per nav entry the user may open, grouped like the sidebar. */
export default function DashboardCards() {
  const { data: auth } = useAuth();

  const items = filterNavByPermissions(
    navigation,
    auth?.data?.permissions ?? [],
    auth?.data?.roles ?? [],
    auth?.data?.onboarded ?? false
  ).filter((item) => item.group !== "Dashboard" && item.url);

  const grouped = items.reduce(
    (acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nothing here yet</CardTitle>
          <CardDescription>
            Your account has no modules assigned. Ask an administrator for access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {MODULE_GROUPS.map((group) => {
        const groupItems = grouped[group];
        if (!groupItems?.length) return null;

        return (
          <section key={group}>
            <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">{group}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupItems.map((item) => (
                <Link key={item.title} href={item.url!} className="group">
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {item.icon && (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <item.icon className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <CardTitle className="flex items-center justify-between gap-2 text-base leading-snug">
                            {item.title}
                            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </CardTitle>
                          {item.description && (
                            <CardDescription>{item.description}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
