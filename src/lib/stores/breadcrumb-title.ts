/**
 * The label a detail page wants shown for its own URL segment.
 *
 * Breadcrumbs title-cases any segment it has no mapping for, which turns a UUID
 * into "01a0aa65 D1fa 724f Aae8 B5ac690b88cd". A detail page knows the real
 * name — the user, the role — so it publishes it here and the
 * breadcrumb uses that instead.
 *
 * Follows the same shape as balance-visibility: a module-level value plus
 * subscribers, read through useSyncExternalStore. Deliberately not persisted —
 * it belongs to whichever page is mounted right now.
 */

let _title: string | null = null;
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((cb) => cb());
}

export const breadcrumbTitleStore = {
  subscribe(onStoreChange: () => void) {
    _listeners.add(onStoreChange);
    return () => {
      _listeners.delete(onStoreChange);
    };
  },
  getSnapshot() {
    return _title;
  },
  getServerSnapshot(): string | null {
    return null;
  },
  set(title: string | null) {
    if (_title === title) return;
    _title = title;
    _notify();
  },
};
