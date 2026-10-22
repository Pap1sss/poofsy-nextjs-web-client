# Poofsy logo: integration guide

## 1. Copy files into your project

| From this bundle                                                          | To your project                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `public/images/poofsy-logo.svg`                                           | `public/images/`                                                               |
| `public/images/poofsy-logo-full.svg`                                      | `public/images/`                                                               |
| `public/images/poofsy-icon.svg`                                           | `public/images/`                                                               |
| `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png` | `public/`                                                                      |
| `components/branding/*`                                                   | `components/branding/` (or `src/components/branding/` if you use `src/`)       |
| `laravel/resources/views/components/application-logo.blade.php`           | Only if Laravel renders Blade views; replaces the Breeze/Jetstream placeholder |

If your Laravel app and Next.js app are separate, the `public/` assets go in the Next.js `public/` folder. Copy them into Laravel's `public/` as well only if Blade views (e.g. emails, auth pages) also show the logo.

Delete any old `app/favicon.ico` (App Router), since a file there overrides `metadata.icons`.

## 2. Favicon

App Router (`app/layout.tsx`), merged into your existing `metadata`:

```ts
export const metadata: Metadata = {
  // ...existing fields
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" }, // Safari and older browsers
    ],
    apple: "/apple-touch-icon.png",
  },
};
```

Pages Router (`pages/_document.tsx`, inside `<Head>`):

```tsx
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

## 3. Using the component

```tsx
import { PoofsyLogo, PoofsyLoadingScreen } from "@/components/branding";

// Sidebar, expanded / collapsed
<PoofsyLogo size="md" href="/dashboard" priority />
<PoofsyLogo variant="icon" size="sm" href="/dashboard" />

// App header (mobile: icon, desktop: full). Swap with your breakpoint utilities.
<PoofsyLogo variant="icon" size={32} href="/dashboard" className="md:hidden" />
<PoofsyLogo size="sm" href="/dashboard" className="hidden md:inline-flex" />

// Login / register
<PoofsyLogo size="xl" href="/" tagline priority />
<PoofsyLogo size="lg" tagline taglineStyle="banner" />

// Next to a visible "Poofsy" text label: make the image decorative
<PoofsyLogo variant="icon" size="xs" alt="" />

// app/loading.tsx
export default function Loading() { return <PoofsyLoadingScreen />; }
```

Size presets are rendered heights: `xs` 24, `sm` 40, `md` 64, `lg` 120, `xl` 200 px. Pass a number, or `width`/`height`, for exact sizes; the aspect ratio is always kept.

The full logo is fairly tall (the mascot sits above the wordmark), so in short horizontal bars (≤ 48px tall) the `icon` variant usually reads better.

## 4. Find and replace old logos

Run from the project root to locate placeholders and duplicated logo markup:

```bash
grep -rniE "logo|favicon|application-logo|>\s*poofsy\s*<" \
  --include=*.{tsx,ts,jsx,js,blade.php,css} \
  --exclude-dir={node_modules,.next,vendor,public} .
ls public | grep -iE "logo|favicon|icon"
```

Replace each hit with `<PoofsyLogo />` (or `<x-application-logo />` in Blade), then remove old image files only after the search shows nothing references them.

## 5. Check

```bash
npm run lint && npx tsc --noEmit && npm run build
```

Then open the app and confirm the tab icon (hard refresh; browsers cache favicons aggressively).
