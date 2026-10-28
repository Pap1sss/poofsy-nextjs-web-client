import { routes } from "@/config/routes";

import type { GuideTopic } from "../types";

export const groups: GuideTopic = {
  id: "groups",
  title: "Groups (Shared Expenses)",
  summary:
    "Splitting a bill with friends: who paid, each person's share, fees and discounts, and who owes whom.",
  sprite: "bag",
  links: [{ label: "Groups", href: routes.groups.home }],
  related: ["debts", "transactions", "budgets"],
  entries: [
    {
      id: "idea",
      title: "The key idea: only your share is your spending",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: "A group keeps track of shared purchases: a food order, a trip, a household's groceries. On its own a group never touches your budget. If you choose to, only your share of an expense counts as your spending, never the whole bill, even when you paid for everyone.",
        },
        {
          type: "terms",
          items: [
            { term: "Paid", text: "Money someone handed over for the group (cash out)." },
            { term: "Share", text: "What someone actually owes for what they had." },
            {
              term: "Balance",
              text: "Paid − share + payments they made − payments they received. Above zero: they get money back. Below zero: they owe. Zero: settled.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      title: "Create a group and add people",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'On Groups, click "New group". Give it a name, and optionally a description, colour and icon.',
            "Leave \"I'm part of this group\" ticked if you share the costs, then type the names of everyone else. They don't need a Poofsy account.",
            'Add or rename people later on the group\'s People tab. "Add someone" can also pick a name from the people you added on Debts.',
          ],
        },
        {
          type: "p",
          text: "Someone who is part of an expense or a payment can't be removed, because that would change the history. Archive them instead: they keep their balance but can't be added to new expenses. Restore brings them back.",
        },
      ],
    },
    {
      id: "expense",
      title: "Add an expense and choose how to split it",
      level: "basics",
      blocks: [
        {
          type: "steps",
          items: [
            'Open the group and click "Add expense". Say what it was and the date; a category is optional.',
            "Pick how it's split and fill in the amount and the people (see the list below).",
            "Add any fees or discounts, each with its own rule.",
            'Under "Who paid?" pick one person (they paid the whole total) or "Several people" and type what each paid. The amounts paid must add up to the total.',
            "Check the Breakdown, then save.",
          ],
        },
        {
          type: "terms",
          items: [
            {
              term: "Equally",
              text: "Everyone ticked pays the same. Untick anyone who wasn't part of it.",
            },
            {
              term: "By amount",
              text: "You type each person's amount; they must add up to the amount entered.",
            },
            {
              term: "By shares",
              text: "2 shares pay twice as much as 1 share. Decimals like 1.5 work.",
            },
            { term: "By percent", text: "Each person's percentage; they must add up to 100%." },
            {
              term: "By quantity",
              text: "Split by how much each person used, like bottles or kilos.",
            },
            {
              term: "By items",
              text: "List each item with its price and quantity, and tick who had it. An item ticked for several people is split equally between them.",
            },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          text: "The Breakdown under the form is worked out by Poofsy as you type: each person's base, fees, discounts and what they owe. If something doesn't add up (percentages short of 100%, amounts that don't match), the message appears there before you save.",
        },
      ],
    },
    {
      id: "fees",
      title: "Delivery fees, service charges and discounts",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Click "Add a fee" or "Add a discount". Each one has a kind (delivery, service charge, platform fee, tax, other, discount, voucher), an amount, and its own way of being shared out:',
        },
        {
          type: "list",
          items: [
            "Split equally among everyone in the expense.",
            "By each person's subtotal: whoever ordered more pays more of it.",
            "By amount or by shares, typed per person.",
            "Only certain people, split equally between them.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          title: "Five friends order food",
          text: [
            "You pay ₱1,500. Food: you ₱100, B ₱400, C ₱350, D ₱250, E ₱200. Delivery ₱100 split equally (₱20 each), service ₱100 by subtotal.",
            'Use "By items", add the two fees, and choose yourself as the payer. B\'s share is ₱400 + ₱20 + ₱30.77 = ₱450.77, and the five shares add up to exactly ₱1,500.',
          ],
        },
        {
          type: "p",
          text: "A discount can't be more than what a person owes, and the expense total must stay above zero.",
        },
      ],
    },
    {
      id: "rounding",
      title: "How centavos are rounded",
      level: "advanced",
      blocks: [
        {
          type: "p",
          text: "Shares are always worked out to the centavo and always add up to the exact total; no centavo is lost or invented. When an amount doesn't divide evenly, the leftover centavos go to the people with the largest remainders, and on a tie to whoever comes first in the group's list. ₱100 split three ways is ₱33.34, ₱33.33 and ₱33.33.",
        },
      ],
    },
    {
      id: "settle",
      title: "Settle up: record who paid whom",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'The Overview tab shows everyone\'s balance and "Suggested settlements": the fewest payments that clear every balance. Nothing is recorded until you click "Record" and confirm the payment.',
        },
        {
          type: "steps",
          items: [
            'Click "Record" on a suggestion, or "Record a payment" on the Settlements tab.',
            "Check who paid, who received it, the amount and the date. Partial payments are fine.",
            'If you paid or received it, choose "In my accounts": "Don\'t record it", or move an account\'s balance (balance only, never income or spending).',
            "Save. Both balances update right away.",
          ],
        },
        {
          type: "p",
          text: "A payment can't be more than the payer owes or more than the receiver is owed. A wrong payment can be corrected (amount, date, reference, notes) or voided with a reason; a voided payment stays in the history but stops counting.",
        },
      ],
    },
    {
      id: "budget",
      title: "Your share in your budget",
      level: "basics",
      blocks: [
        {
          type: "p",
          text: 'Tick "Count my share as spending in my budget" on an expense (it needs a category). Poofsy adds one expense for your share only. Editing the expense updates that same transaction, and deleting the expense removes it, so it is never counted twice.',
        },
        {
          type: "list",
          items: [
            "No account chosen: your share counts as spending, but no account balance changes.",
            'With "Paid from": your share comes out of that account as spending, and what you paid for others moves the account as a balance-only adjustment. So the account drops by what you actually paid, while only your share is spending.',
            "When friends pay you back into that account, record it as balance only and the account goes back up, without counting as income.",
          ],
        },
        {
          type: "callout",
          tone: "example",
          text: "You pay ₱1,000 for four from GCash and tick the box. GCash goes down ₱1,000, but your spending goes up only ₱250. When each friend pays you ₱250 into GCash, GCash goes back up and your income doesn't change.",
        },
        {
          type: "p",
          text: 'Group transactions can\'t be edited on the Transactions page; their row says "Edit on Groups page".',
        },
      ],
    },
    {
      id: "manage",
      title: "Edit, complete or delete",
      level: "advanced",
      blocks: [
        {
          type: "list",
          items: [
            "Editing or deleting an expense recalculates everyone's balance right away. Payments already recorded stay as they are; the form warns you when there are some.",
            '"Mark completed" locks a finished group so it can\'t change; "Reopen group" unlocks it.',
            'A group with no expenses is deleted after one confirmation. One with history asks you to type its name, and offers "Mark completed instead". Shares already recorded in your budget stay there as ordinary transactions.',
            "Groups uses your one currency (as everywhere in Poofsy), so amounts are never mixed across currencies.",
          ],
        },
      ],
    },
  ],
};
