/**
 * Absolute base URL for metadata routes. Next's sitemap and robots handlers
 * require absolute URLs, so this has to be configured per environment —
 * set NEXT_PUBLIC_SITE_URL in production or the sitemap will advertise
 * localhost.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
