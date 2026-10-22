"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CalendarRange, House, Menu, Plus, type LucideIcon } from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { TransactionForm } from "@/features/transaction/components/transaction-form";
import { cn } from "@/lib/utils/component";

type Tab = { href: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: routes.dashboard.home, label: "Home", icon: House },
  { href: routes.budgets.home, label: "Planner", icon: CalendarRange },
];

const TABS_AFTER_ADD: Tab[] = [
  { href: routes.transactions, label: "Transactions", icon: ArrowLeftRight },
];

const ITEM =
  "font-pixel flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] leading-none outline-none focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-highlight";

/**
 * Phone-only bottom bar, in thumb reach: the three daily pages, a raised "add transaction"
 * button in the middle, and Menu for every other page (the sidebar drawer). Hidden from md up,
 * where the sidebar is always on screen.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [adding, setAdding] = useState(false);

  const tab = ({ href, label, icon: Icon }: Tab) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          ITEM,
          active ? "bg-highlight text-highlight-foreground" : "text-muted-foreground"
        )}
      >
        <Icon className="size-5" aria-hidden />
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Main"
        className="bg-card border-outline fixed inset-x-0 bottom-0 z-40 flex border-t-3 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TABS.map(tab)}
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add transaction"
            className="pixel-press bg-primary text-primary-foreground border-outline -mt-4 flex size-14 items-center justify-center border-3 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-highlight"
          >
            <Plus className="size-7" aria-hidden />
          </button>
        </div>
        {TABS_AFTER_ADD.map(tab)}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className={cn(ITEM, "text-muted-foreground")}
        >
          <Menu className="size-5" aria-hidden />
          Menu
        </button>
      </nav>
      <TransactionForm open={adding} onOpenChange={setAdding} />
    </>
  );
}
