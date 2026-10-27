import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const income: GuideTopic = {
  id: "income",
  title: "Managing Income",
  summary: "Income sources, payslips with deductions, and how income reaches your totals.",
  sprite: "coin",
  links: [
    { label: "Income", href: routes.income.home },
    { label: "Income sources", href: routes.income.sources },
    { label: "Deduction Types", href: routes.settings.deduction_types },
  ],
  related: ["budgets", "transactions", "dashboard"],
  entries: [
    {
      id: "two-kinds",
      title: "Expected income vs income received",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Poofsy keeps what you expect to earn separate from what actually arrives.",
        },
        {
          type: "terms",
          items: [
            {
              term: "Income sources",
              text: "What you expect: your salary, freelance work, allowance and so on, with the usual gross and take-home amounts. Budgets use these to plan before payday.",
            },
            {
              term: "Payslips",
              text: "What you received: each pay you record, with its deductions. Every payslip adds an Income transaction to an account.",
            },
          ],
        },
      ],
    },
    {
      id: "sources",
      title: "Add an income source",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Go to Income → "Income sources" and click "Add income source".',
            "Fill in the name, type (Salary, Freelance, Business, Allowance or Other) and how often it arrives: Every payday, Monthly or Irregular.",
            "Enter the expected gross pay and expected take-home (take-home can't be more than gross).",
            'Set "Pay started on". Budgets for cutoffs from this date expect this pay.',
          ],
        },
        {
          type: "terms",
          items: [
            { term: "Every payday", text: "The full take-home is expected in every cutoff." },
            {
              term: "Monthly",
              text: "The take-home is split across the cutoffs in that month.",
            },
            { term: "Irregular", text: "Counts as zero expected income." },
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Sources don't record income by themselves",
          text: 'Poofsy doesn\'t create income automatically, even for an "Every payday" source. The source only sets what budgets expect. Record each pay as a payslip when it arrives.',
        },
      ],
    },
    {
      id: "raise",
      title: "When your pay changes",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'Use "Change pay amount" on the source rather than editing it. Enter the new gross, new take-home and the date the new pay starts, then "Save new pay". The old amount ends the day before, so budgets for earlier cutoffs keep the old figure.',
        },
        {
          type: "p",
          text: 'Editing a source (the pencil) changes its amounts in place, for fixing a typo. Tick "Show ended sources and old pay amounts" to see the history.',
        },
        {
          type: "p",
          text: 'A source that already has income recorded can\'t be deleted. Poofsy offers to end it instead: set "Last day of this income" and click "Set end date". Its payslips stay.',
        },
      ],
    },
    {
      id: "payslip",
      title: "Record a payslip",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On the Income page, click "Record income".',
            'Pick the income source (or "No source"), the account the pay went into ("Paid into") and the pay date.',
            'Enter the gross pay. Add each deduction with "Add deduction": choose a type such as SSS and its amount. A type with a usual amount fills it in for you.',
            "Save. Net pay is worked out for you: gross pay minus deductions.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: [
            "Gross pay ₱25,000 into BPI Savings on Oct 15. Deductions: SSS ₱1,125, PhilHealth ₱625, Pag-IBIG ₱200, Withholding tax ₱1,050.",
            "Net pay = ₱25,000 − ₱3,000 = ₱22,000. Poofsy adds one Income transaction of ₱22,000 to BPI Savings dated Oct 15, and the Oct 15 cutoff's income goes up by ₱22,000.",
          ],
        },
      ],
    },
    {
      id: "effects",
      title: "How income affects your totals",
      level: "basics",
      blocks: [
        {
          type: "list",
          items: [
            "The payslip's Income transaction raises the account's balance by the net pay.",
            "It counts as Earned on Home for any range that includes its date.",
            'It becomes the cutoff\'s actual income in the Payday Planner: as soon as any income is dated in a cutoff, the planner switches from "Income (expected)" to "Income received".',
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "Freelancers can also record income as a plain Income transaction on the Transactions page. It counts the same way; it just has no gross pay or deductions.",
        },
      ],
    },
    {
      id: "edit-delete",
      title: "Edit or delete a payslip",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Edit or delete payslips on the Income page. Editing updates its Income transaction too. Deleting removes both, so the net pay leaves the account's balance and the cutoff's income.",
        },
        {
          type: "callout",
          tone: "warning",
          text: "A payslip's transaction can't be changed on the Transactions page. There you'll see \"Edit on Income page\" instead of the usual menu.",
        },
        {
          type: "p",
          text: "Use the Cutoff filter on the Income page to see the payslips of one cutoff.",
        },
      ],
    },
  ],
};
