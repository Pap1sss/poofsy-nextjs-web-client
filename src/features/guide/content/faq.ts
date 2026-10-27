import type { GuideTopic } from "../types";

export const faq: GuideTopic = {
  id: "faq",
  title: "Frequently Asked Questions",
  summary: "Short answers to the questions people ask most, based on how Poofsy actually works.",
  sprite: "check",
  related: ["troubleshooting", "dashboard", "budgets"],
  entries: [
    {
      id: "balance-vs-budget",
      title: "Why does my balance differ from my budget?",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "They measure different things. Your account balances (and Total money) are what you hold right now, including money left over from earlier cutoffs, savings sitting in accounts, adjustments and track-only expenses that never touched an account. A budget only covers one cutoff: the income dated in it and what you planned, spent and saved during it.",
        },
      ],
    },
    {
      id: "remaining-vs-available",
      title: "Why is my remaining budget different from my available balance?",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "A line's \"left\" is its budgeted amount (plus rollover) minus what you've spent in that category this cutoff. It's a plan, not cash. Your account balance changes with every transaction in every category, transfers between accounts, adjustments and earlier cutoffs. You can have ₱500 left for Food and ₱8,000 in GCash, or the reverse.",
        },
      ],
    },
    {
      id: "fix-transaction",
      title: "How do I correct a transaction I entered wrongly?",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            "Find it on Transactions (search the description or filter by date).",
            "Choose Edit from its menu, fix it and save. Account balances and the cutoff update straight away.",
            'If the row says "Edit on Income page", "Edit on Debts page" or "Edit on PayLater page", correct it there instead.',
          ],
        },
        {
          type: "p",
          text: "Entered it twice? Delete the extra one. Deleting can't be undone.",
        },
      ],
    },
    {
      id: "category-change",
      title: "What happens when I edit or delete a category?",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Renaming or recolouring changes it everywhere, including past transactions; amounts don't change. A category in use can't be deleted: archive it (history stays, it's hidden from pickers) or merge it into another of the same kind (everything moves across and totals stay the same). An unused category can be deleted outright.",
        },
      ],
    },
    {
      id: "repayment",
      title: "How do I record a repayment without counting it as new income?",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Record it on the debt, not as income. Open the debt, click "Record payment" and choose "Back in my account". The account goes up, but Earned and your budget\'s income don\'t change. (Choose "Don\'t record it" if the cash went straight into your pocket and you don\'t track cash as an account.)',
        },
      ],
    },
    {
      id: "installment",
      title: "How do I handle an installment payment?",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Record the purchase once on the PayLater page (it isn\'t spending yet). When an installment is paid, click "Pay" on it and choose "Record it as an expense". If you already added that payment on Transactions, choose "I already recorded it" so it\'s linked instead of counted twice.',
        },
      ],
    },
    {
      id: "summary-wrong",
      title: "What should I do if a figure looks wrong?",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            "Check the date range (Home and Reports) or the cutoff you're looking at.",
            "Look for a transaction with the wrong date, type, account or category, or one entered twice.",
            "Check that transfers into savings carry a savings or investment category, or they won't count as Saved.",
            "Compare each account with your bank or e-wallet app, and Reconcile any that differ.",
            "See Troubleshooting below for more.",
          ],
        },
      ],
    },
    {
      id: "income-not-showing",
      title: 'Why does my budget still say "Income (expected)"?',
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'No income is dated in that cutoff yet. Record your payslip (or an Income transaction) with a pay date inside the cutoff and the planner switches to "Income received". Income sources alone never record income.',
        },
      ],
    },
    {
      id: "devices",
      title: "Do my changes show up on my other devices?",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Yes. Your data lives on the server, and pages open on your other tabs and devices refresh by themselves when something changes. Per-browser preferences (the Hide total and Hide balances eyes, Animations, the form style and your "understood" marks in this guide) are the exception.',
        },
      ],
    },
  ],
};
