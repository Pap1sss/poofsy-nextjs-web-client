import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const welcome: GuideTopic = {
  id: "welcome",
  title: "Welcome to Poofsy",
  summary: "What Poofsy is for, the idea behind it, and what you can do with it.",
  sprite: "mascot",
  links: [
    { label: "Home", href: routes.dashboard.home },
    { label: "Payday Planner", href: routes.budgets.home },
  ],
  related: ["getting-started", "dashboard", "budgets"],
  entries: [
    {
      id: "what-is-poofsy",
      title: "What Poofsy is",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Poofsy is a personal budget tracker built around paydays. Instead of budgeting by calendar month only, it splits your time into cutoffs: the stretch from one payday to the day before the next. You plan where each payday's money goes, record what you actually spend, and Poofsy shows how the two compare.",
        },
        {
          type: "p",
          text: "It was made with the Philippines in mind first (semi-monthly cutoffs on the 15th and the last day, SSS, PhilHealth, Pag-IBIG, GCash and Maya), but a generic setup with monthly pay and any currency is available too.",
        },
      ],
    },
    {
      id: "tagline",
      title: 'Why "Money comes, money goes… poof!"',
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Most of us know the feeling: payday arrives, and a few days later the money has vanished without a clear memory of where it went. Poof!",
        },
        {
          type: "p",
          text: "Poofsy's answer is to make every peso visible. Each payday gets a plan before you spend, each expense lands in a category, and the dashboard shows what came in, what went out and what was saved. The money will still come and go, but now you'll know where it went, and you can decide where it goes next time.",
        },
      ],
    },
    {
      id: "what-you-can-do",
      title: "What you can do with Poofsy",
      level: "basics",
      blocks: [
        {
          type: "list",
          items: [
            "Keep balances for cash, bank accounts, e-wallets and cards (Accounts & Wallets).",
            "Record expenses, income, transfers between your accounts and balance corrections (Transactions).",
            "Record payslips with gross pay and deductions such as SSS, PhilHealth and tax (Income).",
            "Plan each cutoff's money category by category, and see spent vs planned as it happens (Payday Planner).",
            "Track recurring bills, their due dates and which ones are paid or missed (Bills).",
            "Save toward goals, including an emergency fund sized from your own spending (Savings Goals).",
            "Keep track of money you lent and money you borrowed, and the payments in between (Debts).",
            "Track SPayLater, TikTok PayLater and other installment plans without counting a purchase twice (PayLater).",
            "See trends over time in Reports, and paydays and due dates on the Calendar.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Poofsy works out every figure on the server from what you've recorded, so the same numbers show on your phone and your computer. Changes you make on one device appear on your other open tabs and devices automatically.",
        },
      ],
    },
    {
      id: "privacy",
      title: "Your data is yours",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Your accounts, transactions and budgets are visible only to you. Even the app's administrators can't open other people's financial records.",
        },
        {
          type: "p",
          text: "Need to use Poofsy in public? The eye button on the Home page's Total money card hides every amount on screen (they show as *****). It's remembered in this browser until you turn it off.",
        },
      ],
    },
  ],
};
