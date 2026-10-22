"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCalendar } from "./api";
import { calendarQueryKey } from "./constant";

export const useCalendarMonth = (month: string) =>
  useQuery({
    queryKey: [calendarQueryKey, month],
    queryFn: () => fetchCalendar(month),
    select: (res) => res.data,
    // Keep the old month on screen while the next loads, so the grid doesn't flash empty.
    placeholderData: keepPreviousData,
  });
