import { z } from "zod";

/**
 * Money arrives from the API as `{ amount: "12106.59", currency: "PHP" }`: a decimal string, never a float.
 * The frontend only formats and parses amounts; every budget figure is computed by the API.
 */
export type Money = z.infer<typeof moneySchema>;
export const moneySchema = z.object({
  amount: z.string().regex(/^-?\d+(\.\d+)?$/),
  currency: z.string().length(3),
});

const formatters = new Map<string, Intl.NumberFormat>();

const formatter = (
  locale: string,
  currency: string,
  signDisplay: Intl.NumberFormatOptions["signDisplay"]
) => {
  const key = `${locale}|${currency}|${signDisplay}`;
  let cached = formatters.get(key);

  if (!cached) {
    cached = new Intl.NumberFormat(locale, { style: "currency", currency, signDisplay });
    formatters.set(key, cached);
  }

  return cached;
};

/**
 * "12106.59" PHP en-PH -> "₱12,106.59". Formats the decimal string directly
 * (Intl accepts numeric strings), so no float rounding sneaks in.
 */
export function formatMoney(
  { amount, currency }: Money,
  locale = "en-PH",
  signDisplay: Intl.NumberFormatOptions["signDisplay"] = "auto"
) {
  return formatter(locale, currency, signDisplay).format(amount as Intl.StringNumericLiteral);
}

export const isNegative = ({ amount }: Money) => amount.startsWith("-") && /[1-9]/.test(amount);

export const isZero = ({ amount }: Money) => !/[1-9]/.test(amount);

/** The currency's symbol in this locale, e.g. "₱" for PHP in en-PH. */
export function currencySymbol(currency: string, locale = "en-PH") {
  return (
    formatter(locale, currency, "auto")
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

/**
 * Normalizes what a person typed into a decimal string the API accepts:
 * strips grouping and stray characters, keeps one ".", and caps decimals at the currency's minor units.
 * "1,000.505" (2 minor units) -> "1000.50".
 */
export function parseAmountInput(raw: string, minorUnits: number) {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const fraction = rest.join("").slice(0, minorUnits);
  const hasPoint = minorUnits > 0 && cleaned.includes(".");

  return hasPoint ? `${whole}.${fraction}` : whole;
}
