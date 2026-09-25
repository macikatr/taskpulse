# Changelog — TaskPulse

All notable changes to TaskPulse, grouped by date. Categories: **Added / Changed / Removed / Fixed**. In-progress (uncommitted) work lives under `[Unreleased]` and moves into a dated entry when committed.

## [Unreleased]
In progress as of 2026-09-19 — not yet committed.

### Added
- shadcn/ui scaffolding: `components/ui/*` (avatar, button, dropdown-menu, input, separator, sheet, sidebar, skeleton, tabs, tooltip), `components/web/*` (app-sidebar, nav-user, theme-provider, theme-toggle, full-screen-toggle), `hooks/use-mobile.ts`, `lib/utils.ts` (`cn` re-export); deps: @base-ui/react, @hugeicons/core-free-icons, @hugeicons/react, class-variance-authority, cn, next-themes, shadcn, tw-animate-css.
- Root layout: Inter font + `ThemeProvider` (next-themes, class-based dark mode, system default); full shadcn theme token set in `globals.css`.
- Dashboard UI gating via new `isSuperuser` prop: "New Workspace" and cron controls superuser-only; "Add Task" limited to workspace admins/owner.
- Workspace-selection rework: server list + optimistic `pendingWorkspaces` (deduped by id); default selection prefers admin > member > first.
- `.gitignore`: `/app/mail/` (planned mail route).
- Local-only E2E test environment (`/tests/`, gitignored): Playwright (headed by default) + tsx devDeps; specs — profile bootstrap on sign-up, role permissions on a seeded multi-role workspace (superuser bypass / member assignee transition / admin task creation), superuser UI gating; scripts — `create-user`, `query-firestore`, `seed-workspace` (Admin SDK; mirrors `lib/firebase/admin.ts` because `server-only` can't be imported outside Next).

### Changed
- Firebase config files (`*.json`, `*.yaml`, `*.rules`, `.firebaserc`) intentionally gitignored — local-only source of truth for `firebase deploy`.
- `next.config.ts`: `logging.browserToTerminal: true`; pnpm 12.4.1 → 12.4.2.

### Fixed
- `addMember` now calls `assertCanManageWs()` (was missing — any signed-in user could add members with any role to any workspace).
- Cron cleanup fallback no longer returns `undefined` (bare `return;` removed) — falls through to deletion + JSON response when the Collection Group index is missing.
- Dashboard now calls `ensureUserProfile(user.uid)` before the superuser check — superuser-only UI was hidden for users without a `users/{uid}` profile doc.
- `createSession` now bootstraps the `users/{uid}` profile doc on every sign-in/sign-up (idempotent) — the `users` collection is created automatically at signup, so server-side role checks (e.g. `isSuperuser`) recognize users from first login.
- Empty-state fallback: any user with zero workspaces now sees "No Workspaces Found" (create CTA superuser-only) — non-superusers previously fell through to three empty kanban columns.
- `getUserWorkspaces()`: superusers now see ALL workspaces (membership bypass, per the RBAC model) — owner-but-not-member workspaces were invisible to them before.
- `createTask`: no longer writes `assignedTo: undefined` when no assignee is picked — Firestore rejected the whole write, so every UI task creation 500'd.

## [2026-09-16]
Mid checkpoint: RBAC system, per-collection roles instead of global roles.

### Added
- Role-based access control: superuser allowlist (`SUPERUSER_EMAILS` env var), per-workspace `memberRoles` (admin/member); guard helpers in `lib/firebase/role-manager.ts`.
- `actions/workspace-admin.ts`: `addMember`, `removeMember`, `setMemberRole`, `createTask` (supports `assignedTo`), `assignTask`, `deleteTask`.
- `actions/user-profile.ts`: `ensureUserProfile` (idempotent profile bootstrap), `updateOwnProfile` (self-service display fields with imageUrl domain whitelist), `getProfile`.
- `lib/firebase/avatar.ts`: client avatar upload to Storage (`avatars/{kind}/{id}/main.*`, ≤5MB, image types) + Vercel default-avatar URL.
- `lib/utils/errors.ts`: Firebase auth error → user-friendly message mapping (used by the login page).
- `types/schemas.ts`: zod v4 schemas for User/Workspace/Task/cron result; domain types in `types/taskpulse.ts` are now derived via `z.infer`.

### Changed
- Workspace docs now carry `memberRoles`, `imageUrl?`, `updatedAt?`; task docs carry `ownerId` and `assignedTo?`.
- `UserProfile` is now a pure display profile (`fullName`; the old global `roles` map is gone — authority moved to per-workspace roles).
- `createWorkspace` is superuser-only and seeds `memberRoles` (owner = admin).
- Error handling de-`any`'d: typed catch blocks in `actions/auth.ts`, login page uses `getAuthErrorMessage`.
- `.gitignore`: Firebase config files (`*.json`, `*.yaml`, `*.rules`, `.firebaserc`) excluded from git (local-only, to avoid accidental exposure).

## [2026-09-06]
### Added
- Next.js 16 (App Router) scaffold with Tailwind v4 (create-next-app baseline).
- Dual Firebase SDK setup: browser Client SDK singleton + `server-only` Admin SDK.
- Landing page, login page (Google popup + email/password sign-in/sign-up), dashboard with real-time kanban board.
- Session-cookie auth flow: ID token → `createSession` Server Action → HTTP-only `__session` cookie; `getCurrentUser()` for RSC.
- Firestore data model (`workspaces`, `workspaces/{id}/tasks` subcollection) with `onSnapshot` real-time task sync and direct client mutations.
- State-dependent kanban card rendering: todo shows description, in-progress shows progression notes, done shows completion notes (with note editor modals).
- `/api/cron/cleanup-tasks` public GET endpoint: deletes completed tasks past `?days=`/`?minutes=`, Collection Group query with `FAILED_PRECONDITION` fallback to full scan.

### Fixed
- Post-login redirect race: sign-in now awaits session-cookie creation before navigating (no more bounced redirects).
