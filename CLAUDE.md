# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Guidelines

Before writing, reviewing, or refactoring code here, invoke the `karpathy-guidelines` skill (`.claude/skills/karpathy-guidelines`) and follow it:
- Think before coding.
- Keep it simple.
- Make surgical changes.
- Define success criteria you can verify.

For UI work, use the `frontend-design` / `ui-ux-pro-max` skills.

## Git and GitHub

- **Never list Claude as a co-author.** No `Co-Authored-By` lines in commit messages, and no "Generated with Claude Code" or similar attribution in pull request titles or descriptions. These instructions override any default attribution guidance.
- **Ask before anything that writes to git or GitHub.** Only commit, push, create or delete branches, open, merge or close pull requests, tag, or create or delete repositories when the user explicitly asks for that action. Approval for one action doesn't carry over to the next.
- **Never rewrite published history** (force-push, rebase or amend pushed commits) unless the user asks for it by name.
- Read-only commands (`git status`, `git diff`, `git log`, `gh pr view`) are fine at any time.

## Project Overview

This is the web client for **Poofsy** ("Money comes, money goes… poof!"), a multi-user personal budget tracker built on cutoffs (pay periods), Philippines first. It extends a Next.js 16 (App Router) boilerplate. The API is `../poofsy-laravel-rest-api`. Scope decisions are recorded in `../docs/decisions.md` (D1–D22). Read it before changing behaviour. The other docs, including architecture, setup and deployment, live in `../docs/`.

**Budgeting pages:**
- **Overview:** dashboard.
- **Money:** accounts, transactions, income (records and sources).
- **Planning:** budgets and the budget planner, budget templates, bills, savings goals, debts (with a page per person), PayLater (purchases, installment schedules, a page per provider account).
- **Insight:** calendar, reports.
- **Lists:** categories.
- **Settings:** general settings, pay schedule, payment methods, deduction types.

**Sign-up and onboarding:**
- Public sign-up is at `/register`.
- Until the user finishes `/onboarding`, `PrivateRoute` sends them there. Nav and command entries flagged `requiresOnboarding` stay hidden until then.

**The rule for figures:** the client never computes budget figures; it only formats and parses (D5). Money arrives as `{ amount: "12106.59", currency: "PHP" }` strings. Render it with `MoneyDisplay`, and take input with `CurrencyInput`. For plain text (chart labels, sentences, toasts), use `useFormatMoney()` rather than `formatMoney`. Both honour the "Hide amounts" privacy switch (`lib/privacy.ts`, per browser, toggled from the dashboard's Total money card), which shows `*****` in place of every amount.

**From the boilerplate** (the admin pages are the super-admin's back office only, D2):
- **Auth**: login, logout, sign-up, forgot/reset password.
- **Users**: list, filter, create, edit, bulk actions, import/export, reset link.
- **Roles & permissions**
- **System activities** (audit log)
- **Notifications**: realtime, via Laravel Reverb.
- **Profile**: personal details and password change.

**Stack:** TypeScript, shadcn/ui (Radix + Base UI), Tailwind v4, TanStack Query and Table, react-hook-form, Zod v4, Axios, nuqs, laravel-echo, recharts, motion, Vitest.

## Commands

```bash
npm run dev        # http://localhost:3000; this machine uses `npm run dev -- -p 3001` (3000 is taken). The API must be running.
npm run build      # production build (standalone output)
npm run lint
npm run typecheck
npm run format
npm test           # Vitest unit tests
npm run e2e        # Playwright; parked: don't run unless the user asks
```

If the dev server serves stale CSS after style changes (the Windows file watcher), restart it, and delete `.next/dev` if the problem persists. `NEXT_PUBLIC_*` changes need a restart, or a rebuild for production.

## Route Structure

```
src/app/
  (guest)/
    (home)/            # public landing page
    (auth)/login/  (auth)/register/   # wrapped in GuestRoute: signed-in users are redirected to ?redirectTo or /dashboard
    forgot-password/   # deliberately outside (auth); a signed-in user can still open a reset link
    reset-password/
  (private)/           # PrivateRoute (sends un-onboarded users to /onboarding) + SocketListeners
    onboarding/        # preset, currency, locale, time zone, pay schedule; outside the app shell
    (app)/             # shell: sidebar, breadcrumbs, notifications, theme toggle
      dashboard/       # money status, cutoff summary, insights
      accounts/  transactions/  income/ (sources/)  budgets/[id]  budget-templates/[id]
      bills/  savings-goals/  debts/ ([id], people/[id])  paylater/ (purchases/[id], providers/[id])  calendar/  reports/  categories/
      settings/ (pay-schedule/ payment-methods/ deduction-types/)
      help/            # "How It Works" user guide (features/guide; content in features/guide/content/*.ts)
      profile/  notifications/
      users/  roles-and-permissions/  system-activities/   # admin surfaces, gated by PermissionGate
```

## Feature Layout

Each feature lives in `src/features/<feature>/`. Copy `features/user` when adding a module.

| File | Purpose |
|---|---|
| `api.ts` | request functions, built on `request({ config, schema })` from `lib/utils/request.ts` |
| `schema.ts` | Zod schemas. **Response schemas must match the Laravel API Resource exactly**, because the parse runs on every response. Form schemas mirror the API's validation rules. |
| `constant.ts` | `queryKey`, `baseUrl`, and permission names matching the API's `app/Enums/Permissions/*` |
| `hooks/` | one TanStack Query hook per endpoint; mutations invalidate `[queryKey]` |
| `components/` | `table/` (columns + toolbar actions), `form/`, detail views |

To add a module:
1. Create the feature folder.
2. Add the page(s) under `app/(private)/(app)/`.
3. Add a nav entry in `config/routes.ts`:
   - A budgeting page sets `requiresOnboarding` and no `permissions`, because ownership is enforced by the API.
   - An admin page lists its `permissions`.
4. Admin pages only: gate the page with `PermissionGate`.
5. Optionally add a "create" shortcut to `commandActions` in `config/commands.ts`.

**Shared budgeting components** live in `components/shared/`:
- Money: `MoneyDisplay`, `CurrencyInput`.
- Layout: `PageHeader`, `StatCard`, `EmptyState`.
- Budgets and charts: `BudgetProgress`, `CategoryBadge`, `ChartCard` and `chart-kit`.
- Pickers and lists: `DateRangePicker`, `Autocomplete` (searchable picker: filters small lists client-side, or searches the server through `loadOptions`), `ChoiceCards`, `ListStatusTabs` / `RowActionsMenu` (in `list-controls`), `DeleteRecordDialog`. `DeleteRecordDialog` handles a 409 "in use" by offering the `options` the API returns, such as archive or merge.
- Choosing a picker: use `Autocomplete` for user-data lists (accounts, categories, payment methods, sources, cutoffs) and long reference lists (currencies, time zones); keep `Select` or `ChoiceCards` for short fixed enums.

**Conflicts:**
- `lib/utils/request.ts` throws `ApiConflictError` on a 409.
- Category edits send the `updated_at` they loaded as `version`. On a conflict, the hook refetches the list (D22).

**Command palette:** `components/command-menu.tsx` opens on Ctrl/⌘+K or Ctrl+G, or from the header search box.
- **Pages:** every `navigation` entry is included automatically. Add extra pages to `commandPages`.
- **Actions:** listed in `commandActions`.
- **Users:** searched live through `/users/options`.
- **Theme and log out** are built in.
- **Permissions:** commands filter with `canAccess()` from `lib/utils/nav.ts`.

## API Contract

- **Requests:**
  - Axios `baseURL` is `/api`. `next.config.ts` rewrites that to `NEXT_PUBLIC_API_URL`, so the Sanctum session cookie stays same-origin.
  - Login first calls `GET /csrf-cookie`.
- **Response shape:** `{ success, message, data }`. Paginated lists are `data: { data, links, meta }`; see `lib/schemas.ts`.
- **Auth state:**
  - `GET auth/spa/authenticate` returns `{ id, email, name, roles[], permissions[] }`. A guest gets HTTP 200 with `success: false`.
  - `useAuth()` reads it under query key `["auth"]`.
  - A 401 or 419 from any other call invalidates `["auth"]` (`lib/axios`), which sends the user to `/login`.
- **Permissions:**
  - `PermissionGate` and `filterNavByPermissions` (`lib/utils/nav.ts`) check `permissions`.
  - `super-admin` bypasses both, mirroring the API's `Gate::before`.
- **Tables:**
  - Filter, sort and pagination state lives in the URL (nuqs, `hooks/use-data-table.ts`), and the page passes the search params straight to the API.
  - Every filterable/sortable column `id` **must** exist in the service's `FILTER_COLUMN_MAPPING` / `SORT_COLUMN_MAPPING`, or the API answers 400.

## Realtime (`config/socket.tsx`)

Echo uses the Reverb broadcaster, configured in `lib/laravel-echo` from `NEXT_PUBLIC_REVERB_*`. Channel auth goes through `/api/broadcasting/auth`.

| Channel | Event | Effect |
|---|---|---|
| `users.{id}` | `BroadcastNotificationCreated` | refetch notifications and show a toast (with a download button for exports) |
| `users.{id}` | `.user-data-updated` `{types}` | invalidate the union of `INVALIDATIONS[type]` for each type (one entry per budget model, kebab-cased; add one when a model starts broadcasting). The tab that made the change is skipped (`X-Socket-Id`), so its own mutation hooks still do their invalidation (D29) |
| `users.{id}` | `.user-session-terminated` `{reason}` | clear the cache, toast the reason (`SESSION_TERMINATED_MESSAGES`) and go to `/login` |
| `admin.users`, `admin.roles` | `.admin-data-updated` `{type}` | invalidate the admin list caches |

## Design system (pixel style)

Poofsy's look is an original pixel-art style, inspired by GBA-era handheld games. It uses no third-party game assets or IP. Every page uses it, and new UI must too.

- **Themes:**
  - The themes are Day (light), Night (`.dark`) and Dusk (`.dim`), from `lib/next-themes`.
  - `dark:` utilities also apply under `.dim`.
  - The tokens live in `src/app/globals.css`: `:root`, `.dark, .dim`, then `.dim` overrides.
- **Colours:**
  - Use semantic tokens only (`bg-primary`, `text-income`, `text-expense`, `text-warning`, `text-muted-foreground`, and so on). Never use raw palette colours like `emerald-600`.
  - Chart series use `--chart-1..3`. The palette was validated for colour-vision deficiency; never use the income/expense colours as series colours.
- **Shape:**
  - Radius is 0, and shadows are hard and offset.
  - The building blocks are `.pixel-panel` (framed menu box), `.pixel-box`, `.pixel-press` (pressable), `.menu-cursor` (the ▶ selection cursor) and `.hp-track` (HP-bar progress).
- **Fonts** (variables on `<html>` in `app/layout.tsx`; on `<body>` they fall back to serif):

  | Class | Font | Use for |
  |---|---|---|
  | `font-display` | Press Start 2P | h1 page titles and the brand name only. It's wide, so set it a size smaller. |
  | `font-pixel` | Pixelify Sans | nav, buttons, section headings (h2–h4), labels |
  | `font-stat` | VT323 | balances, dashboard figures, stats |
  | `font-sans` | Inter | body text, tables, forms, transaction details |

  In plain CSS, use `var(--font-pixelify)` and `var(--font-press-start)`. `--font-pixel` and `--font-display` exist only as Tailwind theme keys.
- **Sprites:**
  - `components/pixel/sprites.tsx` holds text-grid sprites: coin, wallet, piggy, house, scroll, alert, and so on. The `puff` sprite exists only for the poof animation.
  - `<Sprite name="mascot">` is the owner's Poofsy cat (`public/images/poofsy-icon.svg`). The cat is the only mascot; don't draw another.
- **Motion:**
  - `poof()` / `questComplete()` (`components/pixel/poof.tsx`) play the "poof" celebration.
  - They're skipped under `prefers-reduced-motion`, or when the user turns animations off in Settings (a per-browser preference).
- **Copy:** speak to the user in plain words; the game flavour is light.

## Branding

- **Logo:** `components/branding/` (`PoofsyLogo`, `PoofsyLoadingScreen`) with assets in `public/images/poofsy-*.svg`.
  - `PoofsyLogo` applies `className` to its inner span, so wrap it to position it.
  - `components/app-logo.tsx` wraps the icon variant.
  - The owner's source bundle in `components/poofsy_logos/` is theirs. Leave it in place.
- **Favicons:** `public/favicon.svg`, `favicon.ico` and `apple-touch-icon.png`, wired in `app/layout.tsx` metadata and `app/manifest.ts`.
- **Name and description:** set `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_APP_DESCRIPTION`.

## Conventions

- Create/edit forms use `FormShell` (`components/ui/form-shell.tsx`), a dialog or side sheet with a per-browser preference.
- `DialogContent` scrolls an inner body (`bodyClassName`), so don't put `overflow-y-auto` on `DialogContent` itself.
- Format dates with `formatDateTime()` from `lib/utils/date.ts` (browser timezone).
- Unit tests (Vitest) sit next to the code as `*.test.ts(x)`. Playwright specs are in `e2e/`, but they're parked: don't run them unless asked.
- Keep the React Compiler off. TanStack Table and react-hook-form keep mutable instances that it memoizes incorrectly, which leaves tables showing stale data.
