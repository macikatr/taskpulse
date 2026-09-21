# TODO — TaskPulse

Task tracking with priorities. Use `[ ]` for open and `[x]` for done; when an item lands, move it into `CHANGELOG.md` (with date + category) and refresh `CONTEXT.md`.

## High Priority
- [x] **Call `ensureUserProfile` before the superuser check** (`app/dashboard/page.tsx`) — wired into dashboard pre-render; `createSession` also bootstraps `users/{uid}` on every sign-in/sign-up, so the profile doc exists from first login.
- [ ] **Fix workspace ordering** (`actions/workspace.ts`) — `getUserWorkspaces()` has no `.orderBy()`, but `workspace-client.tsx` assumes "server sorts descending" for default selection. Firestore returns where-filtered docs in implicit index order, so "most recent workspace" is actually arbitrary. Add `.orderBy("createdAt", "desc")` (+ composite index: `memberIds` array-contains + `createdAt`) or sort after fetch.
- [ ] **Protect `/api/cron/cleanup-tasks`** — it is a public GET that deletes completed tasks (`?minutes=0` deletes all). Add a shared-secret query/header check or IP allowlist for external cron use.

## Refactoring / Cleanup
- [ ] Remove commented-out code blocks in `app/dashboard/workspace-client.tsx` (old workspace state/selection, old sync effect).
- [ ] `loadingTasks` is never set to true (`setLoadingTasks(true)` is commented out) — dead state; wire it up or remove.
- [x] Empty-state regression — fixed: any user with zero workspaces now sees "No Workspaces Found" (create CTA superuser-only); previously only superusers got the panel and everyone else saw three empty kanban columns.
- [ ] Narrow `*.json` in `.gitignore` — it silently ignores *any* future JSON file; list `firebase.json` + `firestore.indexes.json` explicitly instead.
- [ ] Remove `firestorecopy.rules` (stale backup of the pre-RBAC rules, on disk but gitignored) or archive it under docs.
- [ ] Wire up or delete unused helpers in `lib/utils/query.ts` (`getMostRecentDocument`, `getLatestWorkspaceForUser`) — no callers today.
- [ ] Fix stale field name in `firestore.rules` task-update denylist: `projectId` → `workspaceId` (no `projectId` field exists on tasks).
- [x] Tighten `storage.rules` — done: removed the `workspaces` write branch (any authed user could overwrite any workspace logo); browser writes now limited to own `users/{uid}` folder, workspace logos are Admin-SDK-only (bypasses rules). Public read kept for both kinds. Required `firebase deploy` to take effect live.
- [ ] Reconcile `UserSchema.fullName` `.toUpperCase()` transform with actual display names (latent — schemas are only used for `z.infer` today).
- [ ] Decide the fate of the `next-devtools-mcp` dependency (agent tooling, currently in runtime `dependencies`).
- [ ] Consider adding `updatedAt` to `WorkspaceSchema` (workspace docs carry it after member ops; the type omits it).
- [ ] Superuser realtime task loading is rule-limited: browser `onSnapshot` reads require `isWorkspaceMember`, so a superuser who isn't in `memberIds` sees the workspace (server pre-render bypass) but an empty board. Rules can't read the env-based allowlist — options: hardcode the superuser list into `firestore.rules`, denormalize a flag on `users/{uid}` for rules to check, or just add the superuser as a member when needed.

## Features
- [x] Gate superuser-only UI: "New Workspace" + cron controls hidden for non-superusers; "Add Task" restricted to workspace admins/owner (via new `isSuperuser` prop) — see High Priority for the profile-bootstrap caveat.
- [ ] Member management UI: add/remove members + change roles (`addMember`/`removeMember`/`setMemberRole` exist as Server Actions, no UI yet).
- [ ] Task assignment UI: pick `assignedTo` on create and reassign later (`createTask`/`assignTask` support it; the UI never passes it).
- [ ] Self-service profile + avatar UI: wire `updateOwnProfile`, `getProfile`, `uploadAvatar`, `defaultAvatarUrl` into the new `(shared-user)/profile` page (currently a "Coming Soon" placeholder, in design).
- [ ] Surface Firestore permission errors in the UI: unauthorized status changes/notes/deletes are rejected by rules and silently `console.error`'d.

## Documentation
- [x] Document `SUPERUSER_EMAILS` and the full `.env.local` variable list (in AGENTS.md "Env vars").
- [x] Note the Collection Group index requirement (`tasks.status`, COLLECTION_GROUP scope) (in AGENTS.md gotchas).
- [ ] Rewrite `README.md` — still create-next-app boilerplate (npm/yarn/bun); document pnpm, env vars, Firebase setup (incl. local-only config files), emulator + App Hosting deploy.
- [ ] Document the emulator workflow now that `firebase.json` defines emulators (apphosting :5002, firestore :8080, UI :8081).
