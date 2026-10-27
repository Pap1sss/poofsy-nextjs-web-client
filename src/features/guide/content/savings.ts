import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const savings: GuideTopic = {
  id: "savings",
  title: "Savings and Financial Goals",
  summary:
    "Goals as earmarks inside your accounts, contributions, progress and the emergency fund.",
  sprite: "piggy",
  links: [{ label: "Savings Goals", href: routes.savings_goals }],
  related: ["categories", "transactions", "dashboard"],
  entries: [
    {
      id: "earmarks",
      title: "How goals work",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "A savings goal (a quest) sets money aside inside your accounts. It never counts as extra money: ₱10,000 in BPI with a ₱6,000 goal is still ₱10,000 in Total money, of which ₱6,000 is spoken for.",
        },
      ],
    },
    {
      id: "create",
      title: "Create a goal",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On Savings Goals, click "Add goal" and name it (for example "New laptop").',
            "Enter the target amount.",
            'Optionally set "Reach it by" and "Where the money is kept" (the account that holds it).',
            "Save.",
          ],
        },
        {
          type: "p",
          text: 'With a "Reach it by" date, the goal shows how much you need to put in each month to finish on time.',
        },
      ],
    },
    {
      id: "contribute",
      title: "Add money or take money out",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Use "Add money" or "Take money out" on the goal. Progress = money added minus money taken out (shown up to 100%), and "Still to save" is never below zero.',
        },
        {
          type: "terms",
          items: [
            {
              term: "No account on the goal",
              text: "The contribution only sets money aside on paper. No money moves.",
            },
            {
              term: "With an account",
              text: 'Tick "Also move the money now" to record one transfer from another account into the goal\'s account (or back out). Add a savings category to count it as Saved in your budget.',
            },
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "Removing a contribution from a goal's History only changes the goal's progress. Any transfer it recorded stays; delete that on the Transactions page if it was a mistake.",
        },
        {
          type: "callout",
          tone: "tip",
          text: "If the goals kept in one account add up to more than its balance, the Savings Goals page warns you, so your earmarks stay honest.",
        },
      ],
    },
    {
      id: "emergency",
      title: "Your emergency fund",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Tick "This is my emergency fund" on one goal and choose how many months it should cover (1–24, 6 by default).',
        },
        {
          type: "p",
          text: "Its target is worked out for you: your average monthly spending in categories marked Essential over the last three full months, times the months to cover. Until you have that history, it uses the target you typed. Home shows how many months it already covers.",
        },
        {
          type: "callout",
          tone: "example",
          text: "Your essential spending (Food Allowance, Bills, Family Allowance, Motor / Transportation) averaged ₱15,000 a month over the last three full months. With 6 months to cover, the target is ₱90,000.",
        },
      ],
    },
    {
      id: "finish",
      title: "Archive or delete a goal",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "Archive a goal you're done with to keep its history; restore it from the Archived tab. A goal with contributions can't be deleted.",
        },
      ],
    },
  ],
};
