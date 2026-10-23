"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils/component";

/** How far (px, after damping) the page must be pulled before letting go reloads it. */
const THRESHOLD = 70;
const MAX_PULL = 110;

/** Opened from the home screen: iOS (navigator.standalone) or an installed PWA. */
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** True when the touch starts inside something that scrolls on its own and isn't at its top. */
function insideScrolledElement(target: EventTarget | null) {
  for (let el = target as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

/**
 * Pull down at the top of the page to reload. iOS gives a home-screen web app no pull-to-refresh of
 * its own, so this fills in there; in a browser tab it stays off and the browser's own one works.
 */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!isStandalone()) return;

    const setBoth = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };

    const onStart = (e: TouchEvent) => {
      // Not while a dialog, sheet or menu is open, or partway down the page or a scrolled list.
      const overlayOpen = document.querySelector("[role=dialog], [role=menu], [role=listbox]");
      startY.current =
        e.touches.length === 1 &&
        window.scrollY <= 0 &&
        !overlayOpen &&
        !insideScrolledElement(e.target)
          ? e.touches[0].clientY
          : null;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        setBoth(0);
        return;
      }
      // Damped, so it feels like pulling against something.
      setBoth(Math.min(dy * 0.5, MAX_PULL));
    };

    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        window.location.reload();
      } else {
        setBoth(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (pull === 0 && !refreshing) return null;

  const ready = refreshing || pull >= THRESHOLD;
  const offset = refreshing ? THRESHOLD : pull;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center"
      style={{ top: `calc(env(safe-area-inset-top) + ${offset - 40}px)` }}
    >
      <div className="pixel-box bg-card font-pixel flex items-center gap-2 px-3 py-2 text-sm">
        <RefreshCw
          aria-hidden
          className={cn("size-4", refreshing && "motion-safe:animate-spin")}
          style={refreshing ? undefined : { transform: `rotate(${(pull / THRESHOLD) * 270}deg)` }}
        />
        {refreshing ? "Refreshing…" : ready ? "Let go to refresh" : "Pull to refresh"}
      </div>
    </div>
  );
}
