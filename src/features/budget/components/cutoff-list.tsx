"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Sprite } from "@/components/pixel/sprites";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/component";

import { useCreateBudget } from "../hooks";
import type { PayPeriod } from "../schema";
import { StatusBadge } from "./budget-planner";

type CutoffListProps = {
  periods: PayPeriod[] | undefined;
  currentPeriodId?: string;
  isLoading: boolean;
};

/** Recent and upcoming cutoffs, newest first, as a menu: the ▶ cursor marks this payday. */
export function CutoffList({ periods, currentPeriodId, isLoading }: CutoffListProps) {
  const create = useCreateBudget();

  return (
    <section aria-labelledby="cutoffs-title" className="pixel-panel space-y-3 p-4">
      <h2 id="cutoffs-title" className="flex items-center gap-2 text-xl">
        <Sprite name="calendar" size={20} />
        Cutoffs
      </h2>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <ol className="divide-y-2 divide-dashed">
          {[...(periods ?? [])].reverse().map((period) => {
            const current = period.id === currentPeriodId;

            return (
              <li
                key={period.id}
                data-active={current}
                className={cn(
                  "menu-cursor flex min-h-14 items-center justify-between gap-3 py-2 pr-1 pl-4",
                  current && "bg-highlight/30"
                )}
                aria-current={current ? "date" : undefined}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{period.label}</p>
                  {current && <p className="font-pixel text-primary text-xs">This payday</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={period.budget?.status ?? null} />
                  {period.budget ? (
                    <Button variant="ghost" size="icon" className="size-11" asChild>
                      <Link
                        href={routes.budgets.detail(period.budget.id)}
                        aria-label={`Open the ${period.label} budget`}
                      >
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      disabled={create.isPending}
                      onClick={() =>
                        create.mutate(
                          { pay_period_id: period.id },
                          {
                            onSuccess: (res) => toast.success(res.message),
                            onError: (error) => toast.error(error.message),
                          }
                        )
                      }
                    >
                      Create
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
