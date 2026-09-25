# CONTEXT — TaskPulse

Project status snapshot. Keep in sync with `AGENTS.md` (architecture), `TODO.md` (work items), and `CHANGELOG.md` (history).

## Current Status
[2026-09-19] The RBAC milestone is committed (`2eb859a`, 2026-09-16: per-workspace roles, profile/avatar actions, zod schemas, typed error handling). In progress (uncommitted): shadcn/ui + next-themes redesign scaffolding, superuser/admin UI gating on the dashboard, workspace-selection rework (optimistic pending workspaces), two security fixes (`addMember` authz guard, cron fallback bare `return;`), and profile bootstrap wiring — `ensureUserProfile` runs before the dashboard superuser check and in `createSession`, so `users/{uid}` is created at sign-in/sign-up. The user profile page is being designed under `app/(shared-user)/profile` (placeholder only — in design, not wired). Role-based E2E coverage now exists locally (`/tests/`, gitignored): profile bootstrap, superuser visibility bypass, member assignee transitions, admin task creation. Fixed along the way: empty-state fallback for non-superusers, superuser workspace visibility in `getUserWorkspaces()`, and a `createTask` crash on `assignedTo: undefined` (UI task creation always 500'd). Remaining known issues are tracked in `TODO.md`; the cron endpoint is still a public GET.

## Architecture Overview
- Next.js 16 App Router, single package, pnpm; React 19, Tailwind v4, lucide-react + shadcn/ui (@base-ui/react), next-themes (class-based dark mode), Inter font.
- Dual Firebase SDK: browser Client SDK (realtime `onSnapshot`, direct `updateDoc`/`deleteDoc`) + server Admin SDK (Server Actions, RSC pre-render). Auth bridges them via an HTTP-only `__session` cookie minted by the `createSession` Server Action from a Firebase ID token.
- Data: Firestore `workspaces` → subcollection `tasks`; `users/{uid}` display profiles. Per-workspace RBAC stored on the workspace doc (`memberIds`, `memberRoles`) plus a `SUPERUSER_EMAILS` allowlist for superusers.
- Security: `firestore.rules` (no client-side creates; assignee/admin task updates), `storage.rules` (avatars), Collection Group index override for `tasks.status`. Admin SDK bypasses rules → Server Actions enforce authorization.
- Domain types: zod v4 schemas in `types/schemas.ts`, re-exported as `z.infer` types from `types/taskpulse.ts`.
- UI: shadcn/ui primitives in `components/ui/`, app-level components in `components/web/` (sidebar, nav-user, theme toggle), `hooks/use-mobile.ts`; root layout wraps everything in `ThemeProvider`. Route group `(shared-user)` hosts the profile page (WIP).
- Firebase config files (`firebase.json`, `.firebaserc`, `*.rules`, `firestore.indexes.json`, `apphosting*.yaml`) are **local-only, intentionally gitignored** — source of truth for `firebase deploy` but not in git.
- Deploy target: Firebase App Hosting (backend id `taskpulse`), project `taskpulse-nextjs`; emulator config in local `firebase.json`.

## Core Components
| Area | Files |
| --- | --- |
| Routes | `app/page.tsx` (landing), `app/login/page.tsx`, `app/dashboard/page.tsx` + `workspace-client.tsx` (kanban) + `sign-out-button.tsx`, `app/(shared-user)/` (profile, WIP) |
| Server Actions | `actions/auth.ts`, `actions/workspace.ts`, `actions/workspace-admin.ts`, `actions/user-profile.ts` |
| Firebase libs | `lib/firebase/client.ts`, `admin.ts`, `auth-client.tsx`, `auth-server.ts`, `role-manager.ts`, `avatar.ts` |
| UI components | `components/ui/*` (shadcn primitives), `components/web/*` (app-sidebar, nav-user, theme-provider/toggle, full-screen-toggle), `hooks/use-mobile.ts`, `lib/utils.ts` (`cn`) |
| Utils / types | `lib/utils/errors.ts`, `lib/utils/query.ts` (unused), `types/schemas.ts` (zod source of truth), `types/taskpulse.ts` |
| Maintenance | `app/api/cron/cleanup-tasks/route.ts` |
| Firebase config (local-only) | `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `apphosting.yaml` |

## Recent Changes
- [2026-09-19] (in progress, uncommitted) shadcn/ui + theming scaffolding; superuser/admin UI gating; workspace-selection rework; fixed `addMember` authz gap and cron fallback bare `return;`; wired `ensureUserProfile` into dashboard pre-render + `createSession` (profile doc created at sign-in/sign-up).
- [2026-09-20] (in progress, uncommitted) local-only Playwright E2E suite under `/tests/` (gitignored) with Admin SDK seed/query scripts; fixed empty-state fallback, superuser workspace visibility (`getUserWorkspaces` bypass), and `createTask` `assignedTo: undefined` crash.
- [2026-09-16] Committed RBAC milestone (`2eb859a`): per-workspace roles, profile/avatar actions, zod schemas, typed error handling; Firebase config files moved to local-only (gitignored).
- [2026-09-06] State-dependent kanban card rendering; cron cleanup endpoint with Collection Group index fallback.
- [2026-09-06] Firestore setup: data model, real-time task sync.
- [2026-09-06] Fixed post-login redirect race (session cookie awaited before navigation).
- [2026-09-06] Initial scaffold + SDKs/GUI (landing, login, dashboard) to test the auth flow.

## Next Steps
1. Fix remaining High Priority items in `TODO.md`: workspace ordering in `getUserWorkspaces()`, protect the cron endpoint.
2. Continue profile page design under `(shared-user)/profile` with the new shadcn components; wire member management + task assignment UI.
3. Add zod runtime validation at the boundaries (per checkpoint commit TODO).
4. Commit the shadcn/gating milestone once the profile page direction is set.
5. Rewrite `README.md` (still create-next-app boilerplate).
