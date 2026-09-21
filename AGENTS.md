<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TaskPulse — Next.js 16 (App Router) + Firebase

Single-package Next.js app (App Router). Dual Firebase SDK: **browser Client SDK** for realtime reads/optimistic writes, **Admin SDK** on the server for server actions / pre-render / privileged queries. Per-workspace RBAC: superuser → workspace admin → member. Project tracking lives in `TODO.md` (work items), `CONTEXT.md` (status), `CHANGELOG.md` (history) — keep all four files consistent.

## Commands
- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint` — ESLint (eslint-config-next)
- No standalone typecheck script — verify with `pnpm lint` then `pnpm build` (`next build` runs the TypeScript check).
- **E2E tests are local-only** (the `/tests/` folder is gitignored): `pnpm test:e2e` — Playwright, headed by default (`--headless` to override), reuses a running dev server on :3000 or starts one. Role specs need seeding first: `pnpm exec tsx tests/scripts/seed-workspace.ts`. Helper scripts (Admin SDK): `pnpm exec tsx tests/scripts/query-firestore.ts <users|profile <email>|workspaces>`, `tests/scripts/create-user.ts <email> <password> [displayName]`.
- Package manager is **pnpm** (see `packageManager` / `pnpm-lock.yaml`); README's npm/yarn/bun lines are boilerplate.

## Path alias
- `@/*` → repo root (tsconfig `paths`). Import as `@/lib/firebase/admin`, `@/actions/workspace`, etc.

## Architecture (where things live)
- `app/page.tsx` — landing page; redirects to `/dashboard` when signed in.
- `app/login/page.tsx` — Google popup + email/password sign-in/sign-up (Client SDK).
- `app/dashboard/page.tsx` — Server Component: `getCurrentUser()` → redirect if anon; pre-renders workspaces via Admin SDK; renders `<WorkspaceClient>`.
- `app/dashboard/workspace-client.tsx` — client kanban: workspace selector, todo/in-progress/done columns, status transitions + progress/completion notes via direct `updateDoc`, cron-trigger UI.
- `lib/firebase/client.ts` — browser SDK singleton (`app`, `auth`, `db`, `storage`); reads `NEXT_PUBLIC_FIREBASE_*`.
- `lib/firebase/admin.ts` — `server-only` Admin SDK (`adminAuth`, `adminDb`, `adminStorage`); reads `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`; falls back to default credentials (ADC) when unset (e.g. App Hosting).
- `lib/firebase/auth-client.tsx` — `AuthProvider`/`useAuth` (browser). Sign-in → `getIdToken()` → `createSession()` server action.
- `lib/firebase/auth-server.ts` — `getCurrentUser()` verifies the HTTP-only `__session` cookie via Admin SDK.
- `lib/firebase/role-manager.ts` — permission helpers: `isSuperuser`, `assertSuperuser`, `isAdminOfWorkspace`, `isMemberOfWorkspace`, `assertWorkspaceAdmin`, `assertWorkspaceMember`.
- `lib/firebase/avatar.ts` — client avatar upload to Storage + Vercel default-avatar URL.
- `lib/utils/errors.ts` — Firebase auth error → user-friendly message mapping (login page).
- `lib/utils/query.ts` — Client SDK query helpers (**currently unused** — no callers).
- `actions/auth.ts` — `createSession(idToken)` / `removeSession()`.
- `actions/workspace.ts` — `createWorkspace` (**superuser-only**), `getUserWorkspaces` (server pre-render read).
- `actions/workspace-admin.ts` — workspace-admin ops: `addMember`, `removeMember`, `setMemberRole`, `createTask` (supports `assignedTo`), `assignTask`, `deleteTask`.
- `actions/user-profile.ts` — `ensureUserProfile` (idempotent profile bootstrap), `updateOwnProfile` (self-service; imageUrl domain whitelist), `getProfile`.
- `app/api/cron/cleanup-tasks/route.ts` — public GET maintenance endpoint.
- `app/(shared-user)/` — route group for user-facing pages (sidebar layout); `profile/page.tsx` is a WIP placeholder.
- `components/ui/` — shadcn/ui primitives; `components/web/` — app-level components (app-sidebar, nav-user, theme-provider/toggle, full-screen-toggle).
- `hooks/use-mobile.ts`, `lib/utils.ts` (`cn` re-export) — shadcn scaffolding.
- Domain types: `types/taskpulse.ts` re-exports from **`types/schemas.ts` — zod v4 schemas are the source of truth**; all domain types are `z.infer` of those schemas (old hand-written interfaces kept commented for reference).

### Auth flow (dual-SDK session cookie)
Login (Client SDK) mints an ID token → `createSession(idToken)` (Actions `auth.ts`) exchanges it for a Firebase **session cookie** and sets an **HTTP-only `__session`** cookie (5-day expiry, httpOnly, `secure` only in prod, sameSite=lax). Server Components read it via `getCurrentUser()`. This is why RSC can see the user without browser storage — keep this indirection intact.

### Permission model (per-workspace RBAC)
There is **no global role map**. Authority lives on each workspace doc plus a superuser allowlist:
- **Superuser** — email in `SUPERUSER_EMAILS` env var (comma-separated; empty = nobody is superuser). Creates workspaces, seeds initial members/roles; every guard checks `isSuperuser()` first and bypasses membership.
- **Workspace admin** — `ownerId` or `memberRoles[uid] === "admin"`. Manages members/roles in *that* workspace, creates/reassigns/deletes tasks there.
- **Member** — uid in `memberIds`. Reads the workspace; on tasks where `assignedTo === uid`: status transitions + progress/completion notes (enforced by Firestore rules).

Guards: Admin SDK bypasses security rules, so **every Server Action must call `getCurrentUser()` and a role check** (`role-manager.ts` helpers) before touching data.

Note: `isSuperuser()` checks the email stored on `users/{uid}` — if the profile doc doesn't exist it returns false. Ensure profile bootstrap (`ensureUserProfile`) has run before superuser checks (see TODO.md).

## Data model (Firestore)
- `workspaces` (top-level): `name, ownerId, memberIds[], memberRoles (Record<uid,"admin"|"member">), imageUrl?, createdAt, updatedAt?`.
- `workspaces/{workspaceId}/tasks` — a **subcollection**. Fields: `title, description?, status, priority, progressNote?, completionNote?, workspaceId, ownerId, createdBy, assignedTo?, completedAt?` (`createdAt/updatedAt` server timestamps). `status ∈ todo|in-progress|done`, `priority ∈ low|medium|high`.
- `users/{uid}` — pure display profile: `uid, email, fullName, imageUrl?, createdAt, updatedAt`. **No global roles** (the old `roles` field is gone; authority is per-workspace).
- Naming convention (same purpose = same name everywhere): `ownerId` (primary controller), `createdBy` (immutable audit — equals `ownerId` at create time), `assignedTo?` (current worker, mutable), `{purpose}At` ISO strings for event times.

## Security rules & Firebase project files (local-only, gitignored)
These files are the source of truth for the live Firebase project but are **intentionally not committed** (`.gitignore`: `*.json`, `*.yaml`, `*.rules`, `.firebaserc`) — a fresh clone must have them locally before `firebase deploy` works:
- `firestore.rules` — browser: read workspace/tasks as a member; self-update of own `users/{uid}` display fields (denylist `uid`, `createdAt`, `roles`); task update = workspace admin **or** assignee (structural fields `assignedTo`/`createdBy` protected); **no create rules** → only Admin SDK (server actions) can create workspaces/tasks.
- `storage.rules` — `avatars/{kind}/{id}/**`: public read; writes for own user folder (≤5MB, image/*); workspace folder currently writable by any authed user (known gap — see TODO.md).
- `firestore.indexes.json` — Collection Group index override on `tasks.status` (required by the cron endpoint's `collectionGroup("tasks").where(...)` query).
- `firebase.json` / `.firebaserc` — project `taskpulse-nextjs`; emulator config (apphosting :5002, firestore :8080, UI :8081); App Hosting backend id `taskpulse` (`apphosting.yaml`).
- **Rules/indexes only take effect after `firebase deploy`** — repo files are the source of truth, but the live project may lag behind.

## Env vars (`.env.local`, gitignored)
- Client: `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`.
- Server: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (service-account cert).
- Permissions: `SUPERUSER_EMAILS` (comma-separated emails; empty = no superusers → workspace creation locked out).

## Gotchas that will bite an agent
- **Tasks live in a subcollection** (`workspaces/{id}/tasks`), *not* a top-level `tasks` collection. Cross-workspace queries must use `collectionGroup("tasks")`.
- **`collectionGroup().where(...)` needs a Collection Group index.** The cron endpoint does this and catches `FAILED_PRECONDITION` (code 9) to fall back to a full scan. If you add collectionGroup `.where()` queries, the index must exist in Firebase Console or you'll get the slow fallback / errors.
- **Firestore `Timestamp`s break RSC serialization.** When mapping docs into `Workspace`/`Task` (or passing to the client), convert with `ts.toDate().toISOString()` into ISO strings (see `actions/workspace.ts` and `workspace-client.tsx`).
- **Firestore rejects `undefined` values in `.set()`/`.add()`** ("Cannot use undefined as a Firestore value"). Omit optional fields entirely instead of passing `undefined` — this is what broke UI task creation via `assignedTo: data.assignedTo` in `createTask`.
- **Admin SDK bypasses security rules** — authorization is your job in server code; check `getCurrentUser()` (and roles) in every Server Action / Admin SDK access. ⚠️ Known gap: `addMember` currently lacks the guard — see TODO.md (High Priority).
- **`FIREBASE_PRIVATE_KEY` in `.env.local` is stored quoted with literal `\n`** — `admin.ts:formatPrivateKey()` unquotes and expands `\n`. Don't "clean it up" to real newlines without keeping `formatPrivateKey()`.
- The **`/api/cron/cleanup-tasks` endpoint is a public GET** (intended for external cron) — it deletes completed tasks past `?days=`/`?minutes=`; treat it as an unauthenticated destructive op when reasoning about security (adding protection is still open in TODO.md).
- **Domain types come from the zod schemas** (`types/schemas.ts`) — edit the schema, not hand-written interfaces. Schemas are currently used for type inference (`z.infer`) only, not runtime parsing.

## Conventions
- Dark slate/indigo UI, Tailwind v4, `lucide-react` + shadcn/ui (@base-ui/react) components, next-themes (class-based dark mode), Inter font.
- "Live Sync" UX = server pre-render (Admin) + `onSnapshot` realtime (Client) + direct `updateDoc`/`deleteDoc` mutations from the browser for status/notes; creations and member management go through Server Actions.
