import { http, HttpResponse } from "msw";

import { accounts, categories, paymentMethods } from "./fixtures";

const ok = <T>(data: T, message = "OK") => HttpResponse.json({ success: true, message, data });

/** The pickers every money form loads (all called with ?status=all). */
export const pickerHandlers = [
  http.get("*/api/accounts", () => ok(accounts)),
  http.get("*/api/categories", () => ok(categories)),
  http.get("*/api/payment-methods", () => ok(paymentMethods)),
];

export { ok };
