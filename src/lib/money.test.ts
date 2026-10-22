import { describe, expect, it } from "vitest";

import {
  currencySymbol,
  formatMoney,
  isNegative,
  isZero,
  moneySchema,
  parseAmountInput,
} from "./money";

const php = (amount: string) => ({ amount, currency: "PHP" });

describe("formatMoney", () => {
  it("formats pesos with the ₱ sign and grouping", () => {
    expect(formatMoney(php("12106.59"))).toBe("₱12,106.59");
    expect(formatMoney(php("1000000"))).toBe("₱1,000,000.00");
  });

  it("keeps negatives negative", () => {
    expect(formatMoney(php("-200.50"))).toBe("-₱200.50");
  });

  it("shows a plus sign only when asked", () => {
    expect(formatMoney(php("500"), "en-PH", "exceptZero")).toBe("+₱500.00");
    expect(formatMoney(php("0"), "en-PH", "exceptZero")).toBe("₱0.00");
  });

  it("uses the currency's own minor units (yen has none)", () => {
    expect(formatMoney({ amount: "1500", currency: "JPY" }, "ja-JP")).toBe("￥1,500");
  });

  it("formats the decimal string exactly, without float drift", () => {
    // 0.1 + 0.2 would be 0.30000000000000004 as a float; the API sends exact strings.
    expect(formatMoney(php("0.30"))).toBe("₱0.30");
    expect(formatMoney(php("999999999999.99"))).toBe("₱999,999,999,999.99");
  });
});

describe("isNegative / isZero", () => {
  it.each([
    ["-200.50", true, false],
    ["200.50", false, false],
    ["0.00", false, true],
    ["-0.00", false, true],
  ])("%s", (amount, negative, zero) => {
    expect(isNegative(php(amount))).toBe(negative);
    expect(isZero(php(amount))).toBe(zero);
  });
});

describe("parseAmountInput", () => {
  it.each([
    ["1,000.505", 2, "1000.50"],
    ["₱ 250", 2, "250"],
    ["12.", 2, "12."],
    ["1.2.3", 2, "1.23"],
    ["abc", 2, ""],
    ["-50", 2, "50"],
    // A currency without minor units drops the fraction instead of keeping a point.
    ["1500.75", 0, "1500"],
  ])("%s with %i decimals -> %s", (raw, minorUnits, expected) => {
    expect(parseAmountInput(raw, minorUnits)).toBe(expected);
  });
});

describe("currencySymbol", () => {
  it("finds the locale's symbol", () => {
    expect(currencySymbol("PHP", "en-PH")).toBe("₱");
    expect(currencySymbol("USD", "en-US")).toBe("$");
  });
});

describe("moneySchema", () => {
  it("accepts the API's decimal strings and rejects floats", () => {
    expect(moneySchema.safeParse(php("12106.59")).success).toBe(true);
    expect(moneySchema.safeParse(php("-1")).success).toBe(true);
    expect(moneySchema.safeParse({ amount: 12106.59, currency: "PHP" }).success).toBe(false);
    expect(moneySchema.safeParse(php("1e5")).success).toBe(false);
  });
});
