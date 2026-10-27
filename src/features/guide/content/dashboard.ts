import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const dashboard: GuideTopic = {
  id: "dashboard",
  title: "Understanding the Dashboard",
  summary: "What each card on Home shows, and exactly how every figure is worked out.",
  sprite: "house",
  links: [{ label: "Home", href: routes.dashboard.home }],
  related: ["budgets", "reports", "faq"],
  entries: [
    {
      id: "range",
      title: "The date range",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Most cards on Home follow the date range picker at the top: "This cutoff", "This month", "Last month", "Last 3 months" or "This year". Total money and Your accounts always show balances right now, whatever range you pick.',
        },
      ],
    },
    {
      id: "total-money",
      title: "Total money",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "The sum of the current balances of all your accounts that aren't archived. Savings goals don't add to it: a goal only sets aside money that is already inside one of these balances.",
        },
        {
          type: "p",
          text: 'The eye button on this card ("Hide amounts") replaces every amount in the app with ***** until you turn it back on. It is remembered in this browser.',
        },
      ],
    },
    {
      id: "money-in-out",
      title: "Money in and out: Earned, Spent, Saved, Left to spend",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Earned",
              text: "All Income transactions dated in the range (payslips create these automatically). For a single cutoff, the hint underneath shows the expected income for comparison.",
            },
            { term: "Spent", text: "All Expense transactions dated in the range." },
            {
              term: "Saved",
              text: "Transfers tagged with a savings or investment category, dated in the range.",
            },
            { term: "Left to spend", text: "Earned − Spent − Saved." },
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: [
            "This cutoff you received ₱18,000, spent ₱9,500 and transferred ₱2,000 into your MariBank savings (tagged with the MariBank category).",
            "Earned ₱18,000 − Spent ₱9,500 − Saved ₱2,000 = Left to spend ₱6,500.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "Left to spend is not the same as Total money. Total money is what your accounts hold right now (including money from earlier cutoffs); Left to spend only looks at what came in and went out during the chosen range. Adjustments and untagged transfers count in neither Spent nor Saved.",
        },
      ],
    },
    {
      id: "cutoff-budget",
      title: "This cutoff's budget",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Shown when the range is exactly one cutoff. It shows the budget\'s status, how much is Planned (the sum of its lines), Left to plan (income minus planned, marked "expected" until income is recorded), the six categories closest to their limit and any warnings. If the cutoff has no budget yet, you\'ll see a "Plan this payday" button instead.',
        },
      ],
    },
    {
      id: "other-cards",
      title: "The other cards",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Start here",
              text: "Appears when nothing has been recorded yet, with shortcuts to record income, plan this payday and add a bill.",
            },
            {
              term: "Recent transactions",
              text: "Your latest transactions, with a link to all of them.",
            },
            { term: "Your accounts", text: "Each account's current balance." },
            {
              term: "Where the money went",
              text: 'Expenses in the range by category, biggest first (the top six; the rest are in Reports). Expenses without a category show as "Uncategorised".',
            },
            {
              term: "What you owe",
              text: 'Only shown if you use PayLater or Debts. PayLater: what\'s still to pay, what\'s due this month, anything overdue and the next payment. Debts: totals for "I owe" and "Owed to me".',
            },
            {
              term: "Bills due soon",
              text: "Unpaid bills due in the next 14 days, including overdue ones.",
            },
            {
              term: "Quests",
              text: "Up to three savings goals, your emergency fund first.",
            },
          ],
        },
      ],
    },
    {
      id: "insights",
      title: '"Worth knowing" insights',
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "Short notes that appear only when something is worth pointing out. The card is hidden when there's nothing to say. Poofsy currently looks for:",
        },
        {
          type: "list",
          items: [
            "A category where this cutoff's spending is at least 20% higher than last cutoff (the biggest jump is shown).",
            "Your savings rate this month compared with last month (needs income recorded this month).",
            "Money spent this cutoff in categories your budget has no line for.",
            "Bills due in the next 7 days.",
            "How many months your emergency fund covers (needs an emergency fund goal and some essential spending in the last three full months).",
          ],
        },
      ],
    },
  ],
};
