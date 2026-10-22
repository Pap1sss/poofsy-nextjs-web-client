"use client";

import Link from "next/link";
import { CircleAlert, Info, TrendingUp } from "lucide-react";

import { Sprite } from "@/components/pixel/sprites";
import { useUserSettings } from "@/features/auth/hooks/useUserSettings";
import { routes } from "@/config/routes";
import { useFormatMoney } from "@/components/shared/money-display";
import { cn } from "@/lib/utils/component";

import { useInsights } from "../hooks";
import type { Insight } from "../schema";

const TONE = {
  warning: { icon: CircleAlert, className: "text-warning" },
  positive: { icon: TrendingUp, className: "text-income" },
  info: { icon: Info, className: "text-muted-foreground" },
} as const;

const pct = (n: number) => `${Math.round(Math.abs(n))}%`;

/** Words each insight the API returned. The block disappears when there's nothing to say. */
export function InsightsList() {
  const { data: insights } = useInsights();
  const { locale } = useUserSettings();
  const format = useFormatMoney();

  if (!insights || insights.length === 0) return null;

  return (
    // Poof's speech box: what the API noticed, worded here.
    <section aria-labelledby="insights-title" className="pixel-panel p-5">
      <div className="flex items-center gap-3">
        <Sprite name="mascot" size={28} />
        <h2 id="insights-title" className="text-lg">
          Worth knowing
        </h2>
      </div>
      <ul className="mt-4 space-y-4">
        {insights.map((insight) => {
          const { icon: Icon, className } = TONE[insight.tone];
          return (
            <li key={insight.type} className="flex gap-3 text-sm leading-relaxed">
              <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />
              <span>{describe(insight, locale, format)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function describe(
  insight: Insight,
  locale: string,
  format: ReturnType<typeof useFormatMoney>
): React.ReactNode {
  switch (insight.type) {
    case "category_spike": {
      const { category, change_percent, this_cutoff, last_cutoff } = insight.data;
      return `You spent ${pct(change_percent)} more on ${category?.name ?? "one category"} this cutoff than last (${format(this_cutoff)} vs ${format(last_cutoff)}).`;
    }
    case "savings_rate": {
      const { this_month_percent: now, last_month_percent: before } = insight.data;
      if (before === null) return `You've saved ${pct(now)} of your income this month.`;
      const direction = now >= before ? "up" : "down";
      return `You've saved ${pct(now)} of your income this month, ${direction} from ${pct(before)} last month.`;
    }
    case "unbudgeted_spending":
      return (
        <>
          {format(insight.data.amount)} went to categories with no allocation this cutoff.{" "}
          <Link
            href={routes.budgets.detail(insight.data.budget_id)}
            className="text-primary underline decoration-2 underline-offset-4 hover:decoration-highlight"
          >
            Add them to your budget
          </Link>
        </>
      );
    case "bills_due_soon": {
      const { count, total } = insight.data;
      return `${count} ${count === 1 ? "bill" : "bills"} totalling ${format(total)} ${count === 1 ? "is" : "are"} due in the next 7 days.`;
    }
    case "emergency_fund_coverage": {
      const { months_covered, goal_months } = insight.data;
      const covered = `${months_covered.toLocaleString(locale, { maximumFractionDigits: 1 })} ${months_covered === 1 ? "month" : "months"}`;
      return goal_months
        ? `Your emergency fund covers ${covered} of essential spending. Your goal is ${goal_months} months.`
        : `Your emergency fund covers ${covered} of essential spending.`;
    }
  }
}
