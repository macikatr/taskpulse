# Changelog — TaskPulse

All notable changes to TaskPulse, grouped by date. Categories: **Added / Changed / Removed / Fixed**. In-progress (uncommitted) work lives under `[Unreleased]` and moves into a dated entry when committed.

## [Unreleased]
In progress as of 2026-09-15 — not yet committed.

### Added
- Role-based access control: superuser allowlist (`SUPERUSER_EMAILS` env var), per-workspace `memberRoles` (admin/member); guard helpers in `lib/firebase/role-manager.ts`.
- `actions/workspace-admin.ts`: `addMember`, `removeMember`, `setMemberRole`, `createTask` (supports `assignedTo`), `assignTask`, `deleteTask`.
- `actions/user-profile.ts`: `ensureUserProfile` (idempotent profile bootstrap), `updateOwnProfile` (self-service display fields with imageUrl domain whitelist), `getProfile`.
- `lib/firebase/avatar.ts`: client avatar upload to Storage (`avatars/{kind}/{id}/main.*`, ≤5MB, image types) + Vercel default-avatar URL.
- `lib/utils/errors.ts`: Firebase auth error → user-friendly message mapping (used by the login page).
- `types/schemas.ts`: zod v4 schemas for User/Workspace/Task/cron result; domain types in `types/taskpulse.ts` are now derived via `z.infer`.
- Firebase project files: `firebase.json`, `.firebaserc` (project `taskpulse-nextjs`), `firestore.rules`, `storage.rules`, `firestore.indexes.json` (Collection Group index override on `tasks.status`), `apphosting.yaml` + emulator config.
- `next.config.ts`: image `remotePatterns` for avatar.vercel.sh and Firebase Storage hostnames.

### Changed
- Workspace docs now carry `memberRoles`, `imageUrl?`, `updatedAt?`; task docs carry `ownerId` and `assignedTo?`.
- `UserProfile` is now a pure display profile (`fullName`; the old global `roles` map is gone — authority moved to per-workspace roles).
- `createWorkspace` is superuser-only and seeds `memberRoles` (owner = admin).
- `AGENTS.md` refreshed to match the RBAC architecture.

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
