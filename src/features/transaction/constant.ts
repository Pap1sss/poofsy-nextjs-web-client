// Other pages invalidate these keys after a write, so balances and budgets refresh together.
export const transactionQueryKey = "transactions";
export const accountsQueryKey = "accounts";
export const categoriesQueryKey = "categories";
export const paymentMethodsQueryKey = "payment-methods";
export const budgetsQueryKey = "budgets";

export const TRANSACTION_TYPES = ["expense", "income", "transfer", "adjustment"] as const;
export const ADJUSTMENT_DIRECTIONS = ["increase", "decrease"] as const;

// Matches IndexTransactionRequest::SORTS.
export const TRANSACTION_SORTS = [
  "-transaction_date",
  "transaction_date",
  "-amount",
  "amount",
] as const;

export const SORT_LABELS: Record<(typeof TRANSACTION_SORTS)[number], string> = {
  "-transaction_date": "Newest first",
  transaction_date: "Oldest first",
  "-amount": "Largest first",
  amount: "Smallest first",
};

export const TYPE_LABELS: Record<(typeof TRANSACTION_TYPES)[number], string> = {
  expense: "Expense",
  income: "Income",
  transfer: "Transfer",
  adjustment: "Adjustment",
};

export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

// AttachmentController: mimes jpg,jpeg,png,webp,pdf, max 5120 KB.
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
