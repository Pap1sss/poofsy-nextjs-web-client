"use client";

import { useSyncExternalStore } from "react";

/**
 * Which guide topics the user marked as understood: a per-browser preference
 * (like "Hide amounts" in lib/privacy.ts), so nothing is stored on the server.
 */
const KEY = "poofsy:guide-understood";
const CHANGE = "poofsy:guide-understood-change";
const EMPTY: string[] = [];

// Cached so useSyncExternalStore gets the same array until something changes.
let understood: string[] | null = null;

function read(): string[] {
  if (understood === null) {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      understood = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    } catch {
      understood = [];
    }
  }
  return understood;
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    understood = null;
    onChange();
  };
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: string[]) {
  understood = next;
  try {
    if (next.length > 0) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the marks work on this page but won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGE));
}

export function setTopicUnderstood(id: string, value: boolean) {
  const current = read().filter((existing) => existing !== id);
  write(value ? [...current, id] : current);
}

export function resetGuideProgress() {
  write([]);
}

/** Topic ids marked as understood in this browser (re-renders when any tab changes them). */
export function useUnderstoodTopics(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
