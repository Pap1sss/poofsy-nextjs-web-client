"use client";

import { useSyncExternalStore } from "react";

/**
 * "Hide amounts": a per-browser privacy switch (like the Animations preference). While it's on,
 * every displayed amount reads as HIDDEN_AMOUNT. Inputs still show what you type.
 */
export const HIDDEN_AMOUNT = "*****";

const KEY = "poofsy:hide-amounts";
const CHANGE = "poofsy:hide-amounts-change";

// Source of truth for this page; storage only persists it, so the switch still works if storage is blocked.
let hidden: boolean | null = null;

function read(): boolean {
  if (hidden === null) {
    try {
      hidden = window.localStorage.getItem(KEY) === "on";
    } catch {
      hidden = false;
    }
  }
  return hidden;
}

function subscribe(onChange: () => void) {
  // Another tab flipped it: drop the cached value and re-read.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    hidden = null;
    onChange();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setAmountsHidden(next: boolean) {
  hidden = next;
  try {
    if (next) window.localStorage.setItem(KEY, "on");
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the switch works for this page but won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Whether amounts are hidden. Re-renders every caller when the switch flips (in any tab). */
export function useAmountsHidden(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
