import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const settings: GuideTopic = {
  id: "settings",
  title: "Settings and Personalization",
  summary:
    "Region and display, budget behaviour, your lists, notifications, your profile, and exporting data.",
  sprite: "star",
  links: [
    { label: "Settings", href: routes.settings.home },
    { label: "Pay Schedule", href: routes.settings.pay_schedule },
    { label: "Profile", href: routes.profile },
    { label: "Notifications", href: routes.notifications.list },
  ],
  related: ["getting-started", "budgets", "categories"],
  entries: [
    {
      id: "region",
      title: "Region and display",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Time zone",
              text: "Decides which day (and so which cutoff) a transaction falls in.",
            },
            {
              term: "Language and number style",
              text: "English (Philippines), Filipino (Philippines), English (United States) or English (United Kingdom). Changes how amounts and dates are written.",
            },
            { term: "Date format", text: "How dates are shown." },
            { term: "Theme", text: "Match my device, Day, Night or Dusk." },
            {
              term: "Currency",
              text: "Shown for reference only. It can't be changed after setup.",
            },
          ],
        },
        {
          type: "p",
          text: 'Click "Save changes" to keep your edits, or "Discard changes".',
        },
      ],
    },
    {
      id: "budget-behaviour",
      title: "Budget behaviour",
      level: "advanced",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Roll unused money into the next cutoff by default",
              text: 'New template rules and lines you add in the planner start with "Roll over" ticked. Existing lines and budgets aren\'t changed.',
            },
            {
              term: "Carry overspending forward too",
              text: "When a rollover line is overspent, the next cutoff's line is reduced by that amount.",
            },
            {
              term: "Warn me when a category reaches N%",
              text: "When a spending line is flagged as getting close (50–100%, 80% by default).",
            },
          ],
        },
      ],
    },
    {
      id: "effects",
      title: "Animations and hiding amounts",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'The "Animations" switch turns off Poofsy\'s celebration effects. They are off anyway when your device asks for reduced motion. "Hide total" (the eye on Home\'s Total money card) masks that total, and "Hide balances" (the eye on Accounts & Wallets) masks the balances there. Both are remembered per browser, so set them on each device.',
        },
      ],
    },
    {
      id: "lists",
      title: "Your lists",
      level: "basics",
      blocks: [
        {
          type: "list",
          items: [
            "Pay schedule: when you're paid. Changes start from a date you choose.",
            "Categories: what you spend and save on.",
            "Payment methods: how you pay (Cash, GCash, cards…).",
            "Deduction types: payroll deductions like SSS and PhilHealth, each with an optional usual amount.",
          ],
        },
        {
          type: "p",
          text: '"Restore defaults" brings back any starter category, payment method or deduction type you deleted, and unarchives archived ones. It never deletes anything, and doesn\'t restore the budget template or the "Cash on hand" account.',
        },
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "The bell at the top and the Notifications page collect your reminders: bills coming due, PayLater installments due or overdue, and heavy PayLater months. They also arrive by email. Click a reminder to open the bill or PayLater purchase it's about. Mark them read or clear them on the Notifications page.",
        },
      ],
    },
    {
      id: "profile",
      title: "Profile and password",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Your Profile holds your name, phone and other personal details. Email and username are shown but can't be changed there. Changing your password signs you out on every device.",
        },
      ],
    },
    {
      id: "export",
      title: "Exporting and backups",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: '"Export CSV" on Transactions and on Debts downloads those lists as spreadsheets. Poofsy doesn\'t have a full backup, an account-wide export or a way to import your own data yet.',
        },
      ],
    },
  ],
};
