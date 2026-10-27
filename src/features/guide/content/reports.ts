import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const reports: GuideTopic = {
  id: "reports",
  title: "Reports and Financial Insights",
  summary: "Every report section, the date range, and the Calendar's day-by-day view.",
  sprite: "chart",
  links: [
    { label: "Reports", href: routes.reports },
    { label: "Calendar", href: routes.calendar },
  ],
  related: ["dashboard", "budgets", "troubleshooting"],
  entries: [
    {
      id: "range",
      title: "Choose a date range",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'At the top of Reports, pick "Last 3 months", "Last 6 months" (the default), "This year" or "Last year", or set your own From and To dates and click "Apply range". A range can be up to two years long. Every section follows the range.',
        },
        {
          type: "p",
          text: "Each section has a Chart / Table switch. The table shows the exact figures behind the chart.",
        },
      ],
    },
    {
      id: "sections",
      title: "What each report shows",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Cash flow",
              text: "Income, Expenses and Saved per month, and Net = income − expenses − saved.",
            },
            {
              term: "Spending by category",
              text: 'Total spent per category over the range: the top 8, with the rest grouped as "Other". Expenses without a category show as "Uncategorised".',
            },
            {
              term: "Savings rate",
              text: "Saved as a percentage of income, month by month.",
            },
            {
              term: "Planned vs actual",
              text: "For each cutoff budget in the range: what you planned against what you spent and saved, including how much was overspent.",
            },
            {
              term: "1st vs 2nd cutoff",
              text: "Average spending in your first cutoff of the month compared with your second. Only cutoffs fully inside the range count.",
            },
            {
              term: "Income",
              text: 'Monthly income by income source; income not linked to a source shows as "Other income".',
            },
            {
              term: "Expenses",
              text: "Monthly expense totals and a table of your 10 largest expenses.",
            },
            {
              term: "Account balances",
              text: "Each account's balance at the end of every month.",
            },
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: 'Adjustments (including reconciliation corrections and debt payments recorded as "Back in my account" or "Out of my account") are left out of every report except Account balances. Transfers count only as Saved, and only when tagged with a savings or investment category.',
        },
      ],
    },
    {
      id: "patterns",
      title: "Spotting your spending patterns",
      level: "advanced",
      blocks: [
        {
          type: "list",
          items: [
            "Spending by category shows where most of your money goes. Start there when you want to cut back.",
            "1st vs 2nd cutoff shows whether one payday regularly stretches thinner, for example because the big bills land in it.",
            "Planned vs actual shows which cutoffs went over plan.",
            "A falling Savings rate is an early warning, even when spending looks normal.",
            "The largest expenses table catches one-off big purchases that skew a month.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: 'Home\'s "Worth knowing" card flags some patterns for you, such as a category jumping 20% or more since last cutoff.',
        },
      ],
    },
    {
      id: "calendar",
      title: "The Calendar",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "The Calendar shows one month at a time (a grid on larger screens, a list on phones): paydays, bills due (and whether they're due, overdue, paid or skipped), and each day's money in and out. The top shows counts of paydays, bills due, overdue and bills paid. Tap a day for its details, with links to the planner and to that day's transactions.",
        },
        {
          type: "p",
          text: "Bills are paid from the Bills page, not from the Calendar.",
        },
      ],
    },
    {
      id: "export",
      title: "Exporting",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'Reports can\'t be exported yet. To work with your data in a spreadsheet, use "Export CSV" on the Transactions page (or on Debts).',
        },
      ],
    },
  ],
};
