"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-browser privacy switches (like the Animations preference), one per area, each toggled by an
 * eye button there. While an area's switch is on, its amounts read as HIDDEN_AMOUNT:
 * - `total`: the dashboard's Total money figure.
 * - `accounts`: the balances on the Accounts page.
 * Every other amount stays visible.
 */
export const HIDDEN_AMOUNT = "*****";

export type PrivacyArea = "total" | "accounts";

const key = (area: PrivacyArea) => `poofsy:hide-${area}`;
const CHANGE = "poofsy:hide-change";

// Source of truth for this page; storage only persists it, so the switch still works if storage is blocked.
const hidden = new Map<PrivacyArea, boolean>();

function read(area: PrivacyArea): boolean {
  let value = hidden.get(area);
  if (value === undefined) {
    try {
      value = window.localStorage.getItem(key(area)) === "on";
    } catch {
      value = false;
    }
    hidden.set(area, value);
  }
  return value;
}

function subscribe(onChange: () => void) {
  // Another tab flipped one: drop the cached values and re-read.
  const onStorage = (event: StorageEvent) => {
    if (!event.key?.startsWith("poofsy:hide-")) return;
    hidden.clear();
    onChange();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setHidden(area: PrivacyArea, next: boolean) {
  hidden.set(area, next);
  try {
    if (next) window.localStorage.setItem(key(area), "on");
    else window.localStorage.removeItem(key(area));
  } catch {
    // Storage blocked: the switch works for this page but won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Whether an area's amounts are hidden. Re-renders every caller when a switch flips (in any tab). */
export function useHidden(area: PrivacyArea): boolean {
  const getSnapshot = useCallback(() => read(area), [area]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
