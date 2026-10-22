"use client";

import { useCallback, useState } from "react";

export interface RowSelection {
  /** In selection mode: checkboxes are shown and per-row menus are hidden. */
  active: boolean;
  ids: Set<string>;
  enter: () => void;
  /** Leave selection mode and drop whatever was picked. */
  exit: () => void;
  toggle: (id: string) => void;
  /** Set a whole batch at once — one day's rows, or everything on screen. */
  setMany: (ids: string[], selected: boolean) => void;
}

/**
 * Selection state for a list that supports picking several rows at once.
 *
 * Held by the page rather than the list so the Select toggle can sit up in the
 * header, where it reads as a mode for the screen, while the checkboxes it
 * reveals live down in the list.
 */
export function useRowSelection(): RowSelection {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const enter = useCallback(() => setActive(true), []);

  const exit = useCallback(() => {
    setActive(false);
    setIds(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = new Set(current);
      // delete() reports whether it removed anything, so one call covers both
      // directions without reading the set twice.
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const setMany = useCallback((batch: string[], selected: boolean) => {
    setIds((current) => {
      const next = new Set(current);
      for (const id of batch) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  return { active, ids, enter, exit, toggle, setMany };
}
