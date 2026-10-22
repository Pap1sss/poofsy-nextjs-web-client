"use client";

import * as React from "react";

/**
 * Mirrors `window.visualViewport.height` into the `--visual-vh` CSS variable.
 *
 * Needed because the on-screen keyboard is invisible to CSS length units on iOS:
 * Safari never shrinks the layout viewport when the keyboard opens, so `vh` and
 * `dvh` both keep reporting the full height. A centred dialog therefore keeps its
 * full size with its lower half behind the keyboard, and because its scroll
 * container still believes it has room, there is nothing to scroll.
 *
 * `visualViewport` is the only API that reflects the keyboard. Android is already
 * handled by `interactive-widget=resizes-content` in the root viewport metadata,
 * which makes the keyboard shrink the layout viewport so `dvh` responds — but
 * writing the variable on every platform keeps one code path in the components.
 *
 * Consumers should always supply a fallback, e.g.
 * `max-h-[calc(var(--visual-vh,100dvh)*0.9)]`, so the styles still work during
 * SSR and in the rare browser without the API.
 */
export function useVisualViewportHeight() {
  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      const root = document.documentElement.style;
      // How tall the visible area is, and where it starts. Both are needed: the
      // height alone caps a dialog's size, but a fixed element is still positioned
      // against the unshrunk layout viewport, so it also has to be offset.
      root.setProperty("--visual-vh", `${viewport.height}px`);
      root.setProperty("--visual-vt", `${viewport.offsetTop}px`);

      // Whether the keyboard is up, which no CSS length can express. Panels that
      // normally leave a strip of the page showing have to stop doing that once
      // the keyboard has taken most of the screen — giving away 20% of what is
      // left is what collapsed the combobox sheet to a few rows.
      //
      // Only ever true on iOS, and correctly so: Android shrinks the layout
      // viewport via `interactive-widget=resizes-content`, so `innerHeight`
      // falls with `viewport.height`, the difference stays near zero, and the
      // flag never sets — `dvh` already answers the keyboard there.
      document.documentElement.toggleAttribute(
        "data-keyboard-open",
        window.innerHeight - viewport.height > 120
      );
    };

    sync();
    viewport.addEventListener("resize", sync);
    // iOS scrolls the page to reveal a focused input, which moves offsetTop without
    // firing resize.
    viewport.addEventListener("scroll", sync);

    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--visual-vh");
      document.documentElement.style.removeProperty("--visual-vt");
      document.documentElement.removeAttribute("data-keyboard-open");
    };
  }, []);
}
