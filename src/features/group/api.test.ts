import { describe, expect, it } from "vitest";

import { toExpensePayload } from "./api";
import type { ExpenseFormValues } from "./schema";

const order = ["me", "ben", "cris"];

const base: ExpenseFormValues = {
  description: " Dinner ",
  expense_date: "2026-10-28",
  category_id: "",
  notes: "",
  split_method: "equal",
  subtotal: "1000",
  parts: {
    cris: { included: true, value: "" },
    me: { included: true, value: "" },
    ben: { included: false, value: "" },
  },
  items: [],
  charges: [],
  payer_mode: "single",
  payer_id: "me",
  payer_amounts: {},
  record_share: false,
  share_account_id: "acc-1",
};

describe("toExpensePayload", () => {
  it("sends ticked people in group order, without values for an equal split", () => {
    const payload = toExpensePayload(base, order, "1000.00");

    expect(payload.description).toBe("Dinner");
    expect(payload).toMatchObject({
      splits: [
        { participant_id: "me", value: null },
        { participant_id: "cris", value: null },
      ],
    });
    expect(payload.payers).toEqual([{ participant_id: "me", amount: "1000.00" }]);
    // The account only matters when the share is recorded.
    expect(payload.share_account_id).toBeNull();
  });

  it("sends no payer until the server has given the total", () => {
    expect(toExpensePayload(base, order).payers).toEqual([]);
  });

  it("sends items instead of a subtotal, and charge splits only where the rule needs them", () => {
    const payload = toExpensePayload(
      {
        ...base,
        split_method: "items",
        items: [
          { name: "Fries", unit_price: "80", quantity: "1", participant_ids: ["cris", "me"] },
        ],
        charges: [
          { kind: "delivery", label: "", amount: "50", allocation: "equal", parts: {} },
          {
            kind: "voucher",
            label: "Promo",
            amount: "20",
            allocation: "assigned",
            parts: { ben: { included: true, value: "9" }, me: { included: false, value: "" } },
          },
        ],
      },
      order
    );

    expect(payload).not.toHaveProperty("subtotal");
    expect(payload).not.toHaveProperty("splits");
    expect(payload).toMatchObject({
      items: [{ name: "Fries", unit_price: "80", quantity: "1", participant_ids: ["me", "cris"] }],
    });
    expect(payload.charges[0].splits).toEqual([]);
    expect(payload.charges[1].splits).toEqual([{ participant_id: "ben", value: null }]);
  });

  it("sends only the people who paid something when several paid", () => {
    const payload = toExpensePayload(
      { ...base, payer_mode: "multiple", payer_amounts: { me: "700", ben: "300", cris: "0" } },
      order
    );

    expect(payload.payers).toEqual([
      { participant_id: "me", amount: "700" },
      { participant_id: "ben", amount: "300" },
    ]);
  });
});
