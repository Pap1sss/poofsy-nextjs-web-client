"use client";

import { useEffect, useSyncExternalStore } from "react";
import { breadcrumbTitleStore } from "@/lib/stores/breadcrumb-title";

/**
 * Call from a detail page with the thing's name, so the breadcrumb shows
 * "Users › Jane Doe" rather than title-casing the UUID in the URL.
 *
 * Pass `null` while the record is still loading. The title clears on unmount,
 * so navigating away can never leave a stale name behind.
 */
export function useSetBreadcrumbTitle(title: string | null | undefined) {
  useEffect(() => {
    breadcrumbTitleStore.set(title ?? null);
    return () => breadcrumbTitleStore.set(null);
  }, [title]);
}

/** Read the published title. Used by Breadcrumbs. */
export function useBreadcrumbTitle() {
  return useSyncExternalStore(
    breadcrumbTitleStore.subscribe,
    breadcrumbTitleStore.getSnapshot,
    breadcrumbTitleStore.getServerSnapshot
  );
}
