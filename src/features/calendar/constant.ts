// Root key: writes elsewhere (bills, transactions, income) can invalidate ["calendar"] to refresh every month.
export const calendarQueryKey = "calendar";

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// Weeks start on Monday, as is common in the Philippines.
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// Bill chips shown in a grid cell before collapsing into "+N more".
export const MAX_BILLS_PER_CELL = 2;
