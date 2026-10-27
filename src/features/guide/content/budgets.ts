import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const budgets: GuideTopic = {
  id: "budgets",
  title: "Budget Planning",
  summary:
    "Cutoffs, the Payday Planner, budget templates, rollover and the warnings that keep you on track.",
  sprite: "calendar",
  links: [
    { label: "Payday Planner", href: routes.budgets.home },
    { label: "Budget Templates", href: routes.budget_templates.home },
    { label: "Pay Schedule", href: routes.settings.pay_schedule },
  ],
  related: ["income", "categories", "dashboard"],
  entries: [
    {
      id: "cutoffs",
      title: "Cutoffs: Poofsy's budget periods",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "A cutoff runs from one payday to the day before the next. Paid on the 15th and the last day of the month? Then one cutoff runs from the 15th to the day before your end-of-month payday, and the next from that payday to the 14th. Without fixed paydays, each cutoff is a calendar month.",
        },
        {
          type: "list",
          items: [
            "A payday on the 31st (or 29th/30th) becomes the last day of shorter months.",
            "Weekend paydays move to the business day before, the business day after, or stay put, as set in your pay schedule. Holidays aren't taken into account.",
            "Every transaction belongs to the cutoff its date falls in.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Changing your pay schedule",
          text: 'On Pay Schedule, "Change pay schedule" starts a new schedule from a date you choose; earlier cutoffs stay as they are. It is refused if a budget already exists for a cutoff on or after that date.',
        },
      ],
    },
    {
      id: "create",
      title: "Plan a payday (create a budget)",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Open the Payday Planner. "This payday" shows the current cutoff; the Cutoffs list on the side shows three months back and two ahead.',
            'For a cutoff with no budget, choose a template under "Start from" (or "An empty budget" to add every line yourself) and click "Create budget", or "Copy last budget" to reuse your previous amounts. The "Create" button in the Cutoffs list uses your default template.',
            "Check each line and change any amount by typing over it.",
            '"Add category" adds a line for a category that isn\'t in the budget yet.',
            'When the plan looks right, click "Start budget".',
          ],
        },
        {
          type: "p",
          text: "A cutoff has one budget. Amounts are fixed when the budget is created: later changes to a template or your pay don't alter it.",
        },
      ],
    },
    {
      id: "read",
      title: "Reading the planner: Planned, Left to plan, Left to spend",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Income",
              text: 'Shows "Income (expected)" from your income sources until any income is dated in the cutoff, then "Income received" with the expected figure underneath.',
            },
            { term: "Planned", text: "The total of all budget lines." },
            {
              term: "Left to plan",
              text: "Income minus Planned. Uses expected income (and says so) until income is recorded. Aim for zero: every peso has a job.",
            },
            {
              term: "Left to spend",
              text: "Income received, minus what you've spent, minus what you've saved or invested in this cutoff. Before income is recorded this can be negative.",
            },
          ],
        },
        {
          type: "p",
          text: 'Each line shows a bar: "X of Y" with "Z left" or "Z over". Budgeted = the line\'s amount plus any rollover. Spending lines count expenses in that category dated in the cutoff; savings and investment lines count transfers tagged with that category. Lines are grouped into Spending, Savings and Investments.',
        },
        {
          type: "p",
          text: '"Unbudgeted spending" lists expenses in categories the budget has no line for, so nothing slips through.',
        },
      ],
    },
    {
      id: "example",
      title: "Example: a food budget for one cutoff",
      level: "basics",
      blocks: [
        {
          type: "callout",
          tone: "example",
          text: [
            "In the Oct 15 cutoff's budget, set Food Allowance to ₱4,000.",
            "You record Groceries ₱1,850 (Oct 16), Lunch ₱185 (Oct 20) and Dinner out ₱1,400 (Oct 25), all as Food Allowance expenses.",
            'The line reads "₱3,435 of ₱4,000" with "₱565 left". The default warning level is 80% (₱3,200), so the Oct 25 dinner also flags the line as getting close.',
            'One more ₱700 dinner makes it "₱135 over", and the line shows as over budget.',
          ],
        },
      ],
    },
    {
      id: "warnings",
      title: "Warnings and overspending",
      level: "basics",
      blocks: [
        {
          type: "list",
          items: [
            'A spending line that reaches your warning level (Settings: "Warn me when a category reaches N%", 80% unless you change it) is flagged as getting close.',
            "A spending line past its budget shows how much it is over.",
            "You're warned if you've planned more than your expected or received income.",
            "Savings and investment lines never warn: going past a savings plan is good news.",
            "If PayLater installments fall due in the cutoff, the planner shows how much to leave room for.",
          ],
        },
      ],
    },
    {
      id: "statuses",
      title: "Draft, Active and Completed",
      level: "advanced",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Draft",
              text: 'Being planned. "Start budget" makes it Active. Only drafts can be deleted ("Delete draft"); the cutoff\'s transactions stay.',
            },
            {
              term: "Active",
              text: 'The cutoff is under way. Lines can still be edited. "Complete cutoff" closes it.',
            },
            {
              term: "Completed",
              text: 'Locked. Rollover is carried forward. "Reopen" makes it Active again if you need to change something.',
            },
          ],
        },
        {
          type: "p",
          text: '"Copy to another cutoff" copies a budget\'s lines (never its transactions) to another cutoff, in any status.',
        },
      ],
    },
    {
      id: "recalculate",
      title: "Recalculate from actual income",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'Lines set as a percentage of income are first worked out from expected income. Once you\'ve recorded the cutoff\'s income, "Recalculate from actual income" redoes them with the real figure. Lines you edited by hand (marked "Edited") are left alone. Until income is recorded the button reads "Recalculate (record income first)".',
        },
      ],
    },
    {
      id: "rollover",
      title: "Rollover: carry leftovers to the next cutoff",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "Tick \"Roll over\" on a line. When you complete the cutoff, what's left on that line (budgeted minus actual) is added to the same category in the next cutoff's budget, if that budget exists and isn't completed. A budget created after a completed one also picks up its rollover.",
        },
        {
          type: "p",
          text: 'Overspending is not carried over unless you turn on "Carry overspending forward too" in Settings; then an overspent line with "Roll over" ticked reduces the next cutoff\'s line. Turn on "Roll unused money into the next cutoff by default" in Settings to have new rules and lines start with "Roll over" ticked.',
        },
      ],
    },
    {
      id: "templates",
      title: "Budget templates",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "A template is a set of rules that fills in a new budget. Your default template is used unless you pick another. On Budget Templates you can edit rules, duplicate, set as default or delete a template (budgets made from it keep their amounts).",
        },
        {
          type: "terms",
          items: [
            { term: "Fixed amount", text: "The same amount each cutoff." },
            {
              term: "Monthly amount, split across cutoffs",
              text: "A monthly figure divided by the number of cutoffs in that month.",
            },
            { term: "Percentage of income", text: "A share of the cutoff's expected income." },
            {
              term: "Enter it each cutoff",
              text: "Starts empty; you type the amount in the planner.",
            },
          ],
        },
        {
          type: "p",
          text: 'Each rule also has "When": every cutoff, 1st cutoff only or 2nd cutoff only (a monthly bill paid from your first pay, for example). A rule can roll over ("Carry what\'s left into the next cutoff"), and savings and investment rules can name the account the money is saved into. Each category appears once per template.',
        },
      ],
    },
  ],
};
