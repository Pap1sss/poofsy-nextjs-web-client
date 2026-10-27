import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const debts: GuideTopic = {
  id: "debts",
  title: "Debt Management",
  summary:
    "Money owed to you and money you owe: recording a debt, payments, corrections and history.",
  sprite: "wallet",
  links: [{ label: "Debts", href: routes.debts.home }],
  related: ["paylater", "transactions", "faq"],
  entries: [
    {
      id: "idea",
      title: "The key idea: a debt is not income or spending",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Lending ₱2,000 to a friend doesn't make you poorer, and getting it back doesn't make you richer. So a debt on its own never counts as income or spending. Only money that actually moves is recorded, and each time you choose how.",
        },
        {
          type: "terms",
          items: [
            {
              term: "Owed to me",
              text: "Someone owes you (you lent money, or paid for them).",
            },
            { term: "I owe", text: "You owe someone (you borrowed money)." },
          ],
        },
      ],
    },
    {
      id: "record",
      title: "Record a debt",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On Debts, click "Add debt" and choose "Money owed to me" or "Money I owe" (this can\'t be changed later).',
            "Pick the person, or type a new name to add them to your people list.",
            "Enter the amount, what it's for and the date. Add a due date and reference if you have them.",
            'If money actually left or entered one of your accounts, tick "The money left one of my accounts" (or "came into"). Poofsy records a balance-only adjustment: the account moves, but it isn\'t spending or income.',
            "Save.",
          ],
        },
      ],
    },
    {
      id: "payments",
      title: "Record a repayment or a payment",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Open the debt and click "Record payment". Enter the amount ("Pay it all" fills in what\'s left), the date and, optionally, the payment method, reference and notes. Then choose how it shows "In my accounts":',
        },
        {
          type: "terms",
          items: [
            {
              term: "Back in my account",
              text: "(Owed to me) The account goes up. Not counted as income, since it was your money already.",
            },
            {
              term: "As income",
              text: "(Owed to me) Recorded as income in the account.",
            },
            {
              term: "Out of my account",
              text: "(I owe) The account goes down. Not counted as spending.",
            },
            {
              term: "As an expense",
              text: "(I owe) Recorded as an expense; you pick a spending category.",
            },
            {
              term: "Don't record it",
              text: "Only the debt's balance changes; no account moves (for cash you don't track).",
            },
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: [
            'You lent Ana ₱2,000 from GCash and ticked "The money left one of my accounts": GCash went down ₱2,000, with no spending recorded.',
            'Ana repays ₱500. Record payment → ₱500 → "Back in my account" → GCash. GCash goes up ₱500, Earned doesn\'t change, and the debt shows ₱1,500 left (Partially paid).',
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: 'Use "As income" or "As an expense" only when the money should count in your budget, such as when you never recorded the original loan. A payment can never be more than what\'s left on the debt.',
        },
      ],
    },
    {
      id: "terms",
      title: "Recording, repaying, paying and settling",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Recording a debt",
              text: "Notes who owes whom and how much. Optionally moves an account (balance-only).",
            },
            {
              term: "Receiving a repayment",
              text: 'A payment on an "Owed to me" debt.',
            },
            { term: "Paying a debt", text: 'A payment on an "I owe" debt.' },
            {
              term: "Fully settled",
              text: "Happens by itself when payments reach the original amount. There's no separate button.",
            },
          ],
        },
        {
          type: "p",
          text: "Statuses are worked out for you: Active, Partially paid, Overdue (past its due date), Fully settled or Cancelled.",
        },
      ],
    },
    {
      id: "fix",
      title: "Correct, void or cancel",
      level: "advanced",
      blocks: [
        {
          type: "list",
          items: [
            '"Correct" a payment to change its amount, date, method, reference or notes. The account and the way it was recorded stay fixed.',
            '"Void" a payment (with a reason) if it never happened. Its transaction is deleted; the payment stays in the history marked void.',
            '"Cancel debt" when it won\'t be paid (for example, forgiven); "Reopen debt" undoes that. A debt with any payment can\'t be deleted, only cancelled.',
          ],
        },
        {
          type: "p",
          text: 'Debt transactions can\'t be edited on the Transactions page; their row says "Edit on Debts page".',
        },
      ],
    },
    {
      id: "overview",
      title: "Review balances and history",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'The Debts page shows totals for Owed to me, I owe, Net position, overdue amounts and settled debts, a "Due soon or overdue" list and all debts, with filters for direction, status, due date and dates. "By person" groups them per person; a person\'s page lists their debts in both directions, never netted together. Every debt has a history of what changed. "Export CSV" downloads the list.',
        },
        {
          type: "callout",
          tone: "tip",
          text: 'Debts don\'t send reminders. Add a due date and check "Due soon or overdue" on the Debts page.',
        },
      ],
    },
  ],
};
