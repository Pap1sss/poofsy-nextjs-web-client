import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const categories: GuideTopic = {
  id: "categories",
  title: "Managing Categories",
  summary:
    "Spending, savings and investment categories, and what archiving, merging and deleting do.",
  sprite: "card",
  links: [{ label: "Categories", href: routes.categories }],
  related: ["transactions", "budgets", "savings"],
  entries: [
    {
      id: "kinds",
      title: "Three kinds of category",
      level: "basics",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Spending",
              text: "Money that leaves, like food or bills. Every expense needs a spending category.",
            },
            {
              term: "Savings",
              text: "For transfers you set aside. A transfer tagged with one counts as Saved.",
            },
            {
              term: "Investment",
              text: "For transfers into investments, like Pag-IBIG MP2. Also counts as Saved.",
            },
          ],
        },
        {
          type: "p",
          text: "Income isn't categorised: income transactions and payslips don't take a category.",
        },
      ],
    },
    {
      id: "create",
      title: "Add or edit a category",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On Categories, click "Add category".',
            "Enter a name (it must be different from your other categories, ignoring capital letters) and choose the kind.",
            "Pick a colour.",
            'Tick "Essential" for must-have spending like food, rent or bills. Essential spending is what sizes your emergency fund.',
            "Save. To rename it or change its colour later, choose Edit from its menu.",
          ],
        },
        {
          type: "p",
          text: "Drag categories to reorder them within their kind. Each row shows how many transactions use it.",
        },
        {
          type: "callout",
          tone: "warning",
          text: "A category's kind can't be changed once it has transactions. Create a new category of the right kind and merge or re-categorise instead.",
        },
        {
          type: "callout",
          tone: "tip",
          text: "If you edit a category while it was changed somewhere else (say, on your phone), Poofsy stops and asks you to reload rather than overwrite the other change.",
        },
      ],
    },
    {
      id: "archive-merge-delete",
      title: "Archive, merge or delete: what happens to your records",
      level: "advanced",
      blocks: [
        {
          type: "terms",
          items: [
            {
              term: "Archive",
              text: "Hides the category from pickers and new budgets. Its transactions, bills and budget lines keep it, and totals don't change. Restore it any time from the Archived tab.",
            },
            {
              term: "Merge into another",
              text: "Moves all its transactions, bills and budget lines to another category of the same kind, then removes it. Totals stay the same; where a budget already has the target category, the amounts are added together.",
            },
            {
              term: "Delete",
              text: 'Only possible when nothing uses the category. If transactions (even deleted ones), bills or budgets use it, Poofsy offers "Merge into another" or "Archive instead".',
            },
          ],
        },
        {
          type: "callout",
          tone: "warning",
          text: "Merging can't be undone. If you might want the category's history separate later, archive it instead.",
        },
      ],
    },
    {
      id: "restore",
      title: "Restore the default categories",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: '"Restore defaults" (on Categories or Settings) brings back any starter category you deleted and unarchives archived ones. It never deletes or changes your own categories.',
        },
      ],
    },
  ],
};
