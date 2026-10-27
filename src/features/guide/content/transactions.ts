import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const transactions: GuideTopic = {
  id: "transactions",
  title: "Tracking Expenses",
  summary:
    "Record expenses, transfers and corrections; attach receipts; find, fix and export transactions.",
  sprite: "receipt",
  links: [
    { label: "Transactions", href: routes.transactions },
    { label: "Payment Methods", href: routes.settings.payment_methods },
  ],
  related: ["categories", "budgets", "faq"],
  entries: [
    {
      id: "types",
      title: "The four kinds of transaction",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Expense",
              text: "Money you spent. Lowers the account and counts as spending.",
            },
            {
              term: "Income",
              text: "Money you received. Raises the account and counts as earned.",
            },
            {
              term: "Transfer",
              text: "Money moved between two of your own accounts, such as cash into GCash. Neither income nor spending; tag it with a savings or investment category to count it as saved.",
            },
            {
              term: "Adjustment",
              text: '"Balance goes up" or "Balance goes down" to correct an account. Neither income nor spending.',
            },
          ],
        },
      ],
    },
    {
      id: "record-expense",
      title: "Record an expense",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Click "Add transaction" (on a phone, the big + button in the bottom bar).',
            "Choose Expense.",
            "Enter the amount and the date (today is filled in).",
            'Write a short description, such as "Lunch at Jollibee".',
            'Choose the account under "Paid from".',
            "Pick a spending category. Expenses need one.",
            "Optionally choose a payment method and add notes, then save.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: [
            "You pay ₱185 for lunch with GCash on Oct 20.",
            'Expense · ₱185 · Oct 20 · "Lunch" · Paid from: GCash · Category: Food Allowance · Payment method: GCash.',
            "Your GCash balance drops by ₱185, Spent goes up by ₱185 on Home, and the Food Allowance line in this cutoff's budget shows ₱185 more spent.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Track-only expenses",
          text: 'Under "Paid from", "None – track only" records an expense without touching any account, for example something a friend paid for you. It still counts toward spending, budgets and reports. Only expenses can be track-only.',
        },
      ],
    },
    {
      id: "transfer",
      title: "Move money between accounts or into savings",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Add a transaction and choose Transfer ("Between your own accounts").',
            'Pick the "From account" and the "To account" (they must be different).',
            'If the money is for savings or investing, choose a "Savings or investment category" such as MariBank. That is what makes it count as Saved.',
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "A transfer without a savings or investment category just moves money: it doesn't count as saved, spent or earned anywhere.",
        },
      ],
    },
    {
      id: "receipts",
      title: "Attach receipts",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'Receipts can be added once a transaction is saved: open it with Edit and use "Attach receipt" in the Receipts section. Photos (JPG, PNG, WebP) and PDFs up to 5 MB each, one at a time. Receipts are private to you; links to open them expire after 10 minutes.',
        },
      ],
    },
    {
      id: "find",
      title: "Find and review transactions",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "The Transactions page lists everything, newest first. Narrow it down with:",
        },
        {
          type: "list",
          items: [
            "Search (descriptions and notes).",
            "From and To dates.",
            "Type, account (also matches the receiving side of a transfer), category and payment method.",
            "Sort: newest, oldest, largest or smallest first.",
          ],
        },
        {
          type: "p",
          text: 'On a phone the filters sit behind the "Filters" button. "Clear filters" resets them all.',
        },
      ],
    },
    {
      id: "edit-delete",
      title: "Edit or delete a transaction",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Use the menu on a transaction's row. Editing or deleting updates the balances of every account involved straight away, and a changed date moves the transaction into the right cutoff.",
        },
        {
          type: "p",
          text: "Some transactions are managed from the page that created them. Their row shows a link instead of the menu:",
        },
        {
          type: "list",
          items: [
            'Payslips: "Edit on Income page".',
            'Debt payments and opening movements: "Edit on Debts page".',
            'PayLater payments and down payments: "Edit on PayLater page".',
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "Deleting a transaction can't be undone. If it was a bill payment, the bill's due date goes back to unpaid so it can be paid again.",
        },
      ],
    },
    {
      id: "export",
      title: "Export to CSV",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: '"Export CSV" on the Transactions page downloads the transactions that match your current filters, ready for a spreadsheet.',
        },
      ],
    },
    {
      id: "payment-methods",
      title: "Payment methods",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "Payment methods (Cash, GCash, cards…) describe how you paid, so you can filter spending by them. Manage them under Setup → Payment Methods. A method can note the account it usually draws from; this is for your reference and doesn't fill in the account for you. A method that has been used can be archived but not deleted.",
        },
      ],
    },
  ],
};
