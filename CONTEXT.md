# CONTEXT — TaskPulse

Project status snapshot. Keep in sync with `AGENTS.md` (architecture), `TODO.md` (work items), and `CHANGELOG.md` (history).

## Current Status
[2026-09-15] The core product loop works end-to-end: sign-in (Google / email+password) → session cookie → dashboard with server-pre-rendered workspaces and a real-time kanban board; the cron endpoint cleans up completed tasks. A role-based access control layer (superuser / workspace admin / member), user profiles, avatar upload helpers, zod v4 domain schemas, and the Firebase project files (rules, indexes, App Hosting config) are implemented but **not yet committed** and partially unwired (member/assignment/profile UI missing). Three high-priority security bugs are tracked in `TODO.md`.

## Architecture Overview
- Next.js 16 App Router, single package, pnpm; React 19, Tailwind v4, lucide-react.
- Dual Firebase SDK: browser Client SDK (realtime `onSnapshot`, direct `updateDoc`/`deleteDoc`) + server Admin SDK (Server Actions, RSC pre-render). Auth bridges them via an HTTP-only `__session` cookie minted by the `createSession` Server Action from a Firebase ID token.
- Data: Firestore `workspaces` → subcollection `tasks`; `users/{uid}` display profiles. Per-workspace RBAC stored on the workspace doc (`memberIds`, `memberRoles`) plus a `SUPERUSER_EMAILS` allowlist for superusers.
- Security: `firestore.rules` (no client-side creates; assignee/admin task updates), `storage.rules` (avatars), Collection Group index override for `tasks.status`. Admin SDK bypasses rules → Server Actions enforce authorization.
- Domain types: zod v4 schemas in `types/schemas.ts`, re-exported as `z.infer` types from `types/taskpulse.ts`.
- Deploy target: Firebase App Hosting (backend id `taskpulse`), project `taskpulse-nextjs`; emulator config in `firebase.json`.

## Core Components
| Area | Files |
| --- | --- |
| Routes | `app/page.tsx` (landing), `app/login/page.tsx`, `app/dashboard/page.tsx` + `workspace-client.tsx` (kanban) + `sign-out-button.tsx` |
| Server Actions | `actions/auth.ts`, `actions/workspace.ts`, `actions/workspace-admin.ts`, `actions/user-profile.ts` |
| Firebase libs | `lib/firebase/client.ts`, `admin.ts`, `auth-client.tsx`, `auth-server.ts`, `role-manager.ts`, `avatar.ts` |
| Utils / types | `lib/utils/errors.ts`, `lib/utils/query.ts` (unused), `types/schemas.ts` (zod source of truth), `types/taskpulse.ts` |
| Maintenance | `app/api/cron/cleanup-tasks/route.ts` |
| Firebase config | `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `apphosting.yaml` |

## Recent Changes
- [2026-09-15] (in progress, uncommitted) RBAC layer + user profiles + avatar helpers + zod v4 schemas + Firebase project files — see `CHANGELOG.md` `[Unreleased]`.
- [2026-09-06] State-dependent kanban card rendering; cron cleanup endpoint with Collection Group index fallback.
- [2026-09-06] Firestore setup: data model, real-time task sync.
- [2026-09-06] Fixed post-login redirect race (session cookie awaited before navigation).
- [2026-09-06] Initial scaffold + SDKs/GUI (landing, login, dashboard) to test the auth flow.

## Next Steps
1. Fix the three High Priority items in `TODO.md` (`addMember` authz gap, cron fallback bare `return;`, public cron endpoint).
2. Build member management + task assignment UI on top of the existing Server Actions.
3. Wire self-service profile/avatar editing into the dashboard.
4. Commit the RBAC milestone; deploy rules/indexes via `firebase deploy`.
5. Rewrite `README.md` (still create-next-app boilerplate).
