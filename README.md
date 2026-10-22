# Next.js Web Boilerplate

This is a Next.js 16 admin web client for the **Laravel API boilerplate**. It ships authentication, user and role management, an audit log, realtime notifications and a profile page, with no business domain. Add your own modules on top.

## Requirements

- Node 20+
- The Laravel API running locally, with its HTTP server, queue worker and Reverb all started.

## Quick start

```bash
# 1. API (in ../laravel-rest-api)
composer dev                 # serve :8000, queue, reverb :8080, scheduler

# 2. Web
npm install
cp .env.example .env         # defaults match the API's .env.example
npm run dev                  # http://localhost:3000
```

With both projects in the same parent folder, `./start-api.sh` and `./start-web.sh` there do the same thing:
- `start-api.sh` clears caches, migrates, then starts the server, Reverb, the queue worker and the scheduler.
- `start-web.sh` starts the dev server, or builds and serves when run with `MODE=prod`.

Ctrl+C stops each script's processes.

Sign in with `juan.delacruz` (or `super.admin@test.com`) / `Password123!!`. That's one of the API's demo accounts, which are seeded outside production only.

Three values must agree between the two projects:

| Web (`.env`) | API (`.env`) |
|---|---|
| `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` | `APP_URL` |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3000` | `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS=localhost:3000` |
| `NEXT_PUBLIC_REVERB_APP_KEY` / `PORT` / `SCHEME` | `REVERB_APP_KEY` / `REVERB_PORT` / `REVERB_SCHEME` |

## What's included

- **Auth:** login, logout, forgot/reset password. Sessions use Sanctum cookies through a same-origin `/api` rewrite, and expired sessions bounce to `/login`.
- **Users:**
  - Server-side table with filtering (name, roles, dates…), sorting and trash views.
  - Create/edit, bulk delete/restore/force-delete/assign roles.
  - Excel import/export (the export arrives as a realtime notification), plus sending a password-reset link.
- **Roles & permissions:** role CRUD, with permissions grouped by category.
- **System activities:** a filterable audit log.
- **Notifications:** an in-app inbox and toasts over Laravel Reverb.
- **Profile:** edit name and phone; change password (requires the current password and signs you out everywhere).
- **Realtime:** lists refresh when another admin changes them, permissions update live, and deleted users are signed out.
- **Theming:** light, dark and dim, with semantic colour tokens.

## Starting a new project

1. Copy the folder and set `"name"` in `package.json`.
2. Rebrand:
   - Set `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_APP_DESCRIPTION`.
   - Change `--primary`, `--ring` and `--sidebar-primary` in `src/app/globals.css`.
   - Replace `src/components/app-logo.tsx` and the icons in `public/` and `src/app/`.
3. Add modules by copying `src/features/user`. See `CLAUDE.md` for the full conventions.

## Docker

`docker build -t web .` builds a standalone image that serves on port 3000. `NEXT_PUBLIC_*` values are inlined at build time from `.env`, so changing them requires a rebuild.
