# TODO — TaskPulse

Task tracking with priorities. Use `[ ]` for open and `[x]` for done; when an item lands, move it into `CHANGELOG.md` (with date + category) and refresh `CONTEXT.md`.

## High Priority
- [ ] **Fix missing authorization in `addMember`** (`actions/workspace-admin.ts`) — the action never calls `assertCanManageWs()`, so any signed-in user can add members (with any role) to any workspace. Add the guard like the sibling actions do.
- [ ] **Fix cron fallback returning `undefined`** (`app/api/cron/cleanup-tasks/route.ts`) — the `FAILED_PRECONDITION` branch ends in a bare `return;`, so when the Collection Group index is missing the route 500s ("Route returned undefined") instead of returning JSON.
- [ ] **Protect `/api/cron/cleanup-tasks`** — it is a public GET that deletes completed tasks (`?minutes=0` deletes all). Add a shared-secret query/header check or IP allowlist for external cron use.

## Refactoring / Cleanup
- [ ] Remove `firestorecopy.rules` (stale backup of the pre-RBAC rules) or archive it under docs.
- [ ] Wire up or delete unused helpers in `lib/utils/query.ts` (`getMostRecentDocument`, `getLatestWorkspaceForUser`) — no callers today.
- [ ] Fix stale field name in `firestore.rules` task-update denylist: `projectId` → `workspaceId` (no `projectId` field exists on tasks).
- [ ] Tighten `storage.rules`: `avatars/workspaces/**` is writable by any signed-in user; rules can't distinguish Admin SDK from browser, so prefer read-only client access + server-side upload for workspace logos.
- [ ] Reconcile `UserSchema.fullName` `.toUpperCase()` transform with actual display names (latent — schemas are only used for `z.infer` today).
- [ ] Decide the fate of the `next-devtools-mcp` dependency (agent tooling, currently in runtime `dependencies`).
- [ ] Consider adding `updatedAt` to `WorkspaceSchema` (workspace docs carry it after member ops; the type omits it).

## Features
- [ ] Member management UI: add/remove members + change roles (`addMember`/`removeMember`/`setMemberRole` exist as Server Actions, no UI yet).
- [ ] Task assignment UI: pick `assignedTo` on create and reassign later (`createTask`/`assignTask` support it; the UI never passes it).
- [ ] Self-service profile + avatar UI: wire `updateOwnProfile`, `getProfile`, `uploadAvatar`, `defaultAvatarUrl` into the dashboard.
- [ ] Gate superuser-only UI: hide/disable "New Workspace" for non-superusers (`createWorkspace` now throws Forbidden for them; the error is only logged to console today).
- [ ] Surface Firestore permission errors in the UI: unauthorized status changes/notes/deletes are rejected by rules and silently `console.error`'d.

## Documentation
- [ ] Rewrite `README.md` — still create-next-app boilerplate (npm/yarn/bun); document pnpm, env vars, Firebase setup, emulator + App Hosting deploy.
- [ ] Document `SUPERUSER_EMAILS` and the full `.env.local` variable list in setup docs.
- [ ] Document the emulator workflow now that `firebase.json` defines emulators (apphosting :5002, firestore :8080, UI :8081).
- [ ] Note the Collection Group index requirement (`tasks.status`, COLLECTION_GROUP scope) and that it must be deployed before the cron endpoint can use indexed queries.
