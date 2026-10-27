import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const paylater: GuideTopic = {
  id: "paylater",
  title: "Buy Now, Pay Later",
  summary:
    "Track SPayLater, TikTok PayLater, LazPayLater and others: purchases, installments, payments and reminders.",
  sprite: "bag",
  links: [{ label: "PayLater", href: routes.paylater.home }],
  related: ["debts", "budgets", "faq"],
  entries: [
    {
      id: "rule",
      title: "The golden rule: spending counts when you pay",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Recording a PayLater purchase records no spending. Each installment counts as spending when you pay it. That way a ₱6,000 phone paid over 6 months shows as ₱1,000 a month in your budget, not ₱6,000 on day one and again as you pay.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Don't record the purchase as an expense too",
          text: "If you also add the whole purchase on the Transactions page, it will be counted twice. Record it only on the PayLater page.",
        },
      ],
    },
    {
      id: "account",
      title: "Add a PayLater account",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On PayLater, click "Add account".',
            "Choose the provider (Shopee SPayLater, TikTok PayLater, LazPayLater or Other PayLater) and an optional nickname.",
            "Optionally add the credit limit and available credit. If you leave available credit empty, Poofsy estimates it as limit minus what you owe and marks it as an estimate.",
            'Optionally set the "Pay date" (day of the month your bill is due). New purchases will suggest that day for their first due date.',
          ],
        },
        {
          type: "p",
          text: "Poofsy never asks for your provider login, password or OTP. Everything is entered by hand from your app's statement.",
        },
      ],
    },
    {
      id: "purchase",
      title: "Record a purchase and its schedule",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Click "Record purchase" and choose the PayLater account.',
            "Fill in what you bought, the store, order number and purchase date.",
            "Enter the purchase amount, down payment, other charges and interest rate as shown on your statement, and an optional spending category.",
            'Enter the months to pay and the first due date, then click "Fill the schedule". Poofsy splits the total equally, with any remainder on the last installment.',
            "Adjust any installment's date or amount to match your statement exactly. The installments must add up to the total to repay.",
            'If you paid a down payment now, tick "I paid the down payment now; record it as an expense".',
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: [
            "A ₱6,000 phone on SPayLater, 6 months, no fees, first due Nov 5.",
            '"Fill the schedule" makes six installments of ₱1,000, due on the 5th of each month. Nothing is added to your spending yet.',
          ],
        },
      ],
    },
    {
      id: "pay",
      title: "Pay an installment",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: '"Pay" on an installment or a purchase, or "Pay bill" on the provider\'s page to pay toward all its purchases at once. A payment goes to the earliest-due installments first and can\'t be more than what\'s owed. Then choose how it shows "In my spending":',
        },
        {
          type: "terms",
          items: [
            {
              term: "Record it as an expense",
              text: 'Adds an expense in the category you choose (leave "Paid from" empty to make it track-only).',
            },
            {
              term: "I already recorded it",
              text: "Links an expense you already added with the same amount, instead of adding another.",
            },
            { term: "Don't record it", text: "Only the PayLater balance changes." },
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: 'On Nov 5 you pay the first ₱1,000 from GCash: "Pay" → ₱1,000 → "Record it as an expense" → category Shopping. GCash drops ₱1,000, Spent rises ₱1,000, and the purchase shows ₱5,000 still to pay.',
        },
        {
          type: "callout",
          tone: "tip",
          text: 'Already logged the payment as an expense on the Transactions page? Choose "I already recorded it" so it\'s linked, not counted twice. Each expense can back only one payment.',
        },
      ],
    },
    {
      id: "statuses",
      title: "Statuses, totals and your budget",
      level: "advanced",
      blocks: [
        {
          type: "list",
          items: [
            "Installments: Upcoming, Due soon (within 7 days), Due today, Partially paid, Overdue, Paid or Cancelled.",
            "Purchases: Active, Overdue, Paid off or Cancelled.",
            "The Overview shows total outstanding, due this month, the next bill (everything due on the next due date across providers), overdue, total paid and available credit.",
            "The Payday Planner shows how much PayLater falls due in the cutoff, so you can leave room for it. It only counts as spending once paid.",
          ],
        },
      ],
    },
    {
      id: "reminders",
      title: "Reminders and limits",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'The "Reminders" button lets you choose: a reminder a few days before an installment is due (3 by default), on the due date, and when it\'s overdue (each once per installment, in the app and by email). You can also set a monthly PayLater limit that warns you when a month passes it, and a percentage of income above which the Payday Planner warns you.',
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
            "Correct a payment's amount and it is spread over the installments again. A linked payment's amount can't change.",
            "Void a payment that didn't happen: an expense Poofsy created is deleted; an expense you linked is only unlinked.",
            "\"Edit schedule\" can't lower an installment below what's already paid on it, or remove one that has payments.",
            "A purchase with any payment is cancelled rather than deleted.",
          ],
        },
        {
          type: "p",
          text: 'PayLater transactions are managed on the PayLater page; on Transactions their row says "Edit on PayLater page".',
        },
      ],
    },
  ],
};
