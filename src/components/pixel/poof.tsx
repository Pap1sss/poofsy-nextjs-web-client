"use client";

import * as React from "react";

import { Sprite } from "@/components/pixel/sprites";

/*
 * The "poof": a short sprite moment when money moves (a transaction is saved) or a savings quest
 * is completed. Fire-and-forget from anywhere with poof() / questComplete(); <PoofHost /> plays it.
 * Skipped entirely under prefers-reduced-motion or when the user turns animations off in Settings.
 */

const EVENT = "poofsy:poof";
const PREF_KEY = "poofsy:animations";

type PoofDetail = { kind: "poof" | "quest"; label?: string };

export function poof(label?: string) {
  window.dispatchEvent(new CustomEvent<PoofDetail>(EVENT, { detail: { kind: "poof", label } }));
}

export function questComplete(label: string) {
  window.dispatchEvent(new CustomEvent<PoofDetail>(EVENT, { detail: { kind: "quest", label } }));
}

/** Per-browser preference; animations are on unless turned off. */
export function animationsEnabled(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAnimationsEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  } catch {
    // Storage blocked: the preference just won't persist.
  }
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function PoofHost() {
  const [active, setActive] = React.useState<(PoofDetail & { id: number }) | null>(null);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onPoof = (event: Event) => {
      if (prefersReducedMotion() || !animationsEnabled()) return;
      const detail = (event as CustomEvent<PoofDetail>).detail;
      clearTimeout(timer);
      setActive({ ...detail, id: Date.now() });
      timer = setTimeout(() => setActive(null), detail.kind === "quest" ? 1800 : 700);
    };

    window.addEventListener(EVENT, onPoof);
    return () => {
      window.removeEventListener(EVENT, onPoof);
      clearTimeout(timer);
    };
  }, []);

  if (!active) return null;

  if (active.kind === "quest") {
    return (
      <div
        key={active.id}
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center px-4"
      >
        <div
          className="pixel-panel flex items-center gap-3 px-5 py-3"
          style={{ animation: "coin-rise 1.8s steps(6) both" }}
        >
          <Sprite name="star" size={28} />
          <p className="font-pixel text-lg">
            Quest complete!
            {active.label && (
              <span className="text-muted-foreground block text-sm">{active.label}</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div key={active.id} aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute bottom-24 left-1/2" style={{ animation: "poof 0.7s steps(4) both" }}>
        <Sprite name="puff" size={54} />
      </div>
      <div
        className="absolute bottom-28 left-[calc(50%+28px)]"
        style={{ animation: "coin-rise 0.7s steps(4) both" }}
      >
        <Sprite name="coin" size={18} />
      </div>
      {active.label && (
        <p
          className="font-pixel absolute bottom-40 left-1/2 -translate-x-1/2 text-sm"
          style={{ animation: "coin-rise 0.7s steps(4) both" }}
        >
          {active.label}
        </p>
      )}
    </div>
  );
}
