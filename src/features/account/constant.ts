import type { SpriteName } from "@/components/pixel/sprites";

import type { AccountType } from "./schema";

export const accountQueryKey = "accounts";

// Each account is an item in the wallet menu, drawn by what kind of place the money sits in.
export const ACCOUNT_SPRITE: Record<AccountType, SpriteName> = {
  cash: "wallet",
  bank: "card",
  e_wallet: "card",
  credit_card: "card",
  savings: "piggy",
  investment: "piggy",
  loan: "bag",
  other: "bag",
};
