import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const gettingStarted: GuideTopic = {
  id: "getting-started",
  title: "Getting Started",
  summary: "Sign up, finish the three setup steps, add your accounts and find your way around.",
  sprite: "flag",
  links: [
    { label: "Accounts & Wallets", href: routes.accounts },
    { label: "Pay Schedule", href: routes.settings.pay_schedule },
    { label: "Settings", href: routes.settings.home },
  ],
  related: ["dashboard", "income", "settings"],
  entries: [
    {
      id: "sign-up",
      title: "Create your account",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            "On the sign-up page, enter your first name, last name, email and a password (twice).",
            'Click "Create account". You are signed in and taken to setup.',
          ],
        },
        {
          type: "p",
          text: "You can sign in later with your email or your username. Your username is made for you from your email; you can see it on your Profile page.",
        },
      ],
    },
    {
      id: "setup",
      title: "The three setup steps",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Before the budgeting pages open, Poofsy asks three things on the "Set up your budget" screen. Use "Back" and "Continue" to move between steps.',
        },
        {
          type: "steps",
          items: [
            'Where you\'re based: pick a region ("Philippines" for semi-monthly cutoffs in ₱ with SSS and PhilHealth, or "Other / Generic" for monthly pay in any currency), then your currency and time zone. The time zone decides which day a late-night expense lands on.',
            'When you get paid: choose "On fixed paydays" or "Whenever I\'m paid". For fixed paydays, pick how often (twice a month, once a month, every week or every two weeks), the payday(s), and what happens when a payday falls on a weekend.',
            'Check and finish: review the summary and click "Finish setup".',
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Currency is permanent",
          text: "Every total uses the currency you choose here, and it can't be changed after setup. Your time zone, date format and number style can be changed any time in Settings.",
        },
        {
          type: "callout",
          tone: "tip",
          text: '"Whenever I\'m paid" (no fixed paydays) makes each cutoff a calendar month. You can add a pay schedule later from the Pay Schedule page.',
        },
      ],
    },
    {
      id: "what-you-get",
      title: "What setup creates for you",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Finishing setup fills in starter lists so you can begin right away. With the Philippines region you get:",
        },
        {
          type: "terms",
          items: [
            {
              term: "Spending categories",
              text: "Family Allowance, Motor / Transportation, Food Allowance, Bills (these four are marked essential), Personal Care, Leisure, Shopping, Other Expenses.",
            },
            {
              term: "Savings categories",
              text: "Emergency Fund, MariBank, Paluwagan, General Savings.",
            },
            { term: "Investment categories", text: "Pag-IBIG MP2, Investment." },
            {
              term: "Budget template",
              text: '"Default", with a line for every category that you can fill in with your own amounts.',
            },
            {
              term: "Payment methods",
              text: "Cash, GCash, Maya, Debit card, Credit card, Bank transfer.",
            },
            { term: "Deduction types", text: "SSS, PhilHealth, Pag-IBIG, Withholding tax." },
            { term: "Account", text: '"Cash on hand", starting at zero.' },
          ],
        },
        {
          type: "p",
          text: "All of these are yours to rename, archive or delete. If you remove some by mistake, Settings → Restore defaults brings back the missing categories, payment methods and deduction types.",
        },
      ],
    },
    {
      id: "accounts",
      title: "Add your accounts and wallets",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "An account is anywhere money sits: your wallet, a bank account, GCash, a credit card. Every transaction moves money in or out of an account, and the account's balance updates by itself.",
        },
        {
          type: "steps",
          items: [
            'Open Accounts & Wallets and click "Add account".',
            "Give it a name (for example BPI Savings or GCash) and pick a type: Cash, Bank, E-wallet, Credit card, Savings, Investment, Loan or Other.",
            'Enter the starting balance: what the account holds today. For a credit card or loan that starts below zero, tick "This account starts below zero".',
            "Save. Repeat for each place you keep money.",
          ],
        },
        {
          type: "terms",
          items: [
            {
              term: "Balance",
              text: "Starting balance, plus income, minus expenses, plus or minus transfers and adjustments. Poofsy recalculates it every time a transaction is added, edited or deleted.",
            },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Start with today's real balances and record from today onward. You don't need to enter your whole history for Poofsy to be useful.",
        },
      ],
    },
    {
      id: "reconcile",
      title: "Match an account to your bank statement (Reconcile)",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "If an account's balance in Poofsy doesn't match your bank app or statement, reconcile it instead of guessing a correction.",
        },
        {
          type: "steps",
          items: [
            'On Accounts & Wallets, open the account\'s menu and choose "Reconcile".',
            'Enter the statement balance (tick "The statement shows a negative balance" if it\'s below zero), add a note if you like, and click "Reconcile".',
            "If the balances differ, Poofsy records one Adjustment transaction dated today for the difference, then shows the statement balance, the balance before and the adjustment.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "Adjustments correct a balance only. They never count as income or spending, so they won't show up in your budget or most reports. If the gap is really a missing expense, record the expense instead.",
        },
      ],
    },
    {
      id: "archive-account",
      title: "Archive or delete an account",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "An account with any transactions can't be deleted, because that would erase history. Archive it instead: it disappears from pickers and from Total money, its past transactions stay, and you can restore it from the Archived tab. An account that was never used can be deleted.",
        },
      ],
    },
    {
      id: "navigation",
      title: "Finding your way around",
      level: "basics",
      blocks: [
        {
          type: "list",
          items: [
            "The sidebar groups pages into Budget (daily money pages), Setup (lists and preferences) and Help (this guide). On a phone, open it with Menu in the bottom bar.",
            "On a phone, the bottom bar has Home, Planner, a big + button to add a transaction, Transactions and Menu.",
            "Press Ctrl + K (⌘ + K on a Mac) or click the search box at the top to jump to any page by typing its name.",
            "The bell at the top shows reminders and other notifications. The theme button switches between Day, Night, Dusk and Match my device.",
            "Your Profile (from the menu under your name) holds your personal details and password.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: 'Forms open as a centred dialog. On a larger screen, the icon in a form\'s corner switches it to a side sheet ("Switch to side sheet"); your choice is remembered in this browser.',
        },
      ],
    },
  ],
};
