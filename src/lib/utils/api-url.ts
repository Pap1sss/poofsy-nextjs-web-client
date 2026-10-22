/**
 * Turns an API-relative path (e.g. a notification's `download_link`) into a
 * same-origin URL through the `/api` rewrite, so the session cookie is sent.
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  return `/api/${path.replace(/^\/+/, "")}`;
}
