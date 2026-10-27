import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const troubleshooting: GuideTopic = {
  id: "troubleshooting",
  title: "Troubleshooting",
  summary: "Common mistakes, empty screens, unexpected totals, and what to do when you're stuck.",
  sprite: "alert",
  links: [
    { label: "Transactions", href: routes.transactions },
    { label: "Accounts & Wallets", href: routes.accounts },
  ],
  related: ["faq", "transactions", "dashboard"],
  entries: [
    {
      id: "empty",
      title: "My dashboard is empty",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'That\'s normal on day one. The "Start here" card walks you through the first three steps:',
        },
        {
          type: "steps",
          items: [
            "Record your income (a payslip on the Income page).",
            "Plan this payday (create the cutoff's budget in the Payday Planner).",
            "Add a bill you pay regularly.",
          ],
        },
        {
          type: "p",
          text: 'Then record expenses as they happen. If you have data but a card is empty, check the date range: "This cutoff" only covers the current cutoff.',
        },
      ],
    },
    {
      id: "mistakes",
      title: "Common mistakes and how to fix them",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Savings recorded as an expense",
              text: "Moving money into a savings account is a Transfer with a savings category, not an expense. Edit the transaction's type.",
            },
            {
              term: "A transfer that doesn't count as Saved",
              text: "Add a savings or investment category to the transfer.",
            },
            {
              term: "PayLater purchase entered as an expense",
              text: "Delete that expense and record the purchase on the PayLater page; record each installment when paid.",
            },
            {
              term: "A debt repayment entered as income",
              text: 'Delete the income transaction and record the payment on the debt with "Back in my account".',
            },
            {
              term: "Income in the wrong cutoff",
              text: "The cutoff comes from the pay date. Edit the payslip's pay date.",
            },
            {
              term: "An expense on the wrong day",
              text: "Check your time zone in Settings: it decides which day (and cutoff) a late-night expense lands on.",
            },
          ],
        },
      ],
    },
    {
      id: "totals",
      title: "Totals or reports look unexpected",
      level: "advanced",
      blocks: [
        {
          type: "list",
          items: [
            "Adjustments are left out of income, spending and most reports. A large correction won't show as spending.",
            "Track-only expenses count as spending but don't change any balance.",
            "Archived accounts are left out of Total money and the account list.",
            "Payslips count their net pay (after deductions), not gross.",
            'Spending is matched to a budget line by category and date, so an expense in a category the budget doesn\'t plan for appears under "Unbudgeted spending".',
            "Recently changed something on another device? The page refreshes by itself; if it doesn't, reload the page.",
          ],
        },
      ],
    },
    {
      id: "blocked",
      title: "Poofsy won't let me delete or change something",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "Poofsy protects your history. Things with history are archived, cancelled or ended rather than deleted, and the message tells you what to do instead:",
        },
        {
          type: "list",
          items: [
            "Accounts, categories, payment methods and deduction types in use: archive them.",
            "Income sources with payslips: end them.",
            "Bills with payments: deactivate them.",
            "Debts and PayLater purchases with payments: cancel them.",
            "Completed budgets: reopen them first.",
            "Payslip, debt and PayLater transactions: change them on their own page.",
            "A pay schedule change that would affect existing budgets: choose a start date after your last budget.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: 'If a category edit says it "was changed somewhere else", reload the page and make your change again.',
        },
      ],
    },
    {
      id: "still-stuck",
      title: "Still stuck?",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            "Reload the page. If you were signed out, sign in again.",
            "Search this guide for the page or word you're stuck on.",
            "Reconcile the account against your bank or e-wallet statement to rule out a balance gap.",
            "Note what you did, the page and any message shown, and contact the person or team that runs your Poofsy.",
          ],
        },
      ],
    },
  ],
};
