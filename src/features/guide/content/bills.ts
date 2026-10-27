import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const bills: GuideTopic = {
  id: "bills",
  title: "Bills and Due Dates",
  summary: "Recurring bills, reminders, paying on time and catching up on missed ones.",
  sprite: "scroll",
  links: [
    { label: "Bills", href: routes.bills },
    { label: "Calendar", href: routes.calendar },
  ],
  related: ["transactions", "budgets", "reports"],
  entries: [
    {
      id: "add",
      title: "Add a recurring bill",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On Bills, click "Add bill" and give it a name (for example PLDT Fiber) and its usual amount.',
            'Under "Repeats", choose every week, every month, every 2 months, every 3 months or every year, and the day it\'s due ("Last day" works for month-end bills).',
            'Set "Starting from" and how many days before to remind you (0 reminds you on the day).',
            "Optionally pick a spending category and the account it's usually paid from, then save.",
          ],
        },
        {
          type: "p",
          text: "Poofsy lists the bill's due dates for the next 90 days.",
        },
      ],
    },
    {
      id: "pay",
      title: "Mark a bill as paid",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Find the due date under "Upcoming" (or "Missed" if it\'s past due) and click "Mark as paid".',
            'Confirm "Paid from" (or "None – track only"), the amount paid, the date you paid and, optionally, the payment method.',
            "Save. Poofsy records one expense in the bill's category, so it shows in your spending and budget.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "You can't pay the same due date twice by accident; a second click is ignored. If you delete that expense on the Transactions page, the due date goes back to unpaid.",
        },
      ],
    },
    {
      id: "tabs",
      title: "Upcoming, Missed, Paid, Skipped and All bills",
      level: "basics",
      blocks: [
        {
          type: "list",
          items: [
            "Upcoming: unpaid due dates from today on.",
            "Missed: past due dates you haven't paid or skipped, going back to the bill's start date (up to 12 months). Pay each with its real paid-on date, or skip it.",
            "Paid: due dates already paid.",
            'Skipped: due dates you skipped, newest first. "Undo skip" puts one back under Upcoming or Missed.',
            "All bills: the bills themselves, to edit, deactivate or delete.",
          ],
        },
        {
          type: "p",
          text: '"Skip this time" marks a due date as not needed (no money moves); undo it straight away from the message that appears, or later from the Skipped tab.',
        },
      ],
    },
    {
      id: "reminders",
      title: "Reminders",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "Active bills send one reminder per due date, in the app (under the bell) and by email. Poofsy checks once a day, so the reminder arrives within the window you chose: from the number of days before up to the due date itself.",
        },
      ],
    },
    {
      id: "stop",
      title: "Stop or remove a bill",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: 'Deactivate a bill you no longer pay; it stops creating due dates and reminders, and you can reactivate it later (the months it was off are marked skipped, not missed). A bill that has payments can\'t be deleted; Poofsy offers "Deactivate instead".',
        },
      ],
    },
  ],
};
