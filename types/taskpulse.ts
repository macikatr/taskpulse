// types/taskpulse.ts

import z from "zod";
import { UserSchema, WorkspaceSchema, WorkspaceRoleSchema, TaskSchema, TaskStatusSchema, TaskPrioritySchema } from "./schemas";

// ─── Shared Enums ──────────────────────────────────────────────────────────────

// export type TaskStatus = "todo" | "in-progress" | "done";
// export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// Role a user holds *within a specific workspace*.
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;
// - "admin": manages members, creates/assigns tasks, deletes tasks in this workspace.
// - "member": reads the workspace; works on tasks where they are `assignedTo`.

// ─── Access model ──────────────────────────────────────────────────────────────
// There is NO global (cross-workspace) permission map. Authority is per-workspace:
//
//   Superuser          (Firebase project owner; implicit, via Admin SDK)
//     • create workspaces
//     • decide members + assign workspace roles
//     • read/delete anything (Firebase Console / Admin SDK)
//
//   Workspace "admin"  (ownerId, or memberRoles[uid] === "admin")
//     • manage members in THIS workspace
//     • create tasks (ownerId = the admin) and assign them to members
//     • update any task in this workspace (reassign, drive status)
//     • delete tasks in this workspace
//
//   Workspace "member" (memberIds contains uid; memberRoles[uid] === "member")
//     • read the workspace and its tasks
//     • on tasks where `assignedTo` == them: update status (todo→in-progress→done)
//       and write progress / completion notes
//
//   (Cron job, Admin SDK) deletes completed tasks past the maintenance window.
//
// Naming convention: same purpose = same name across every collection.
//   ownerId          string        Primary controller / head (transferable by superuser)
//   createdBy        string        Original author (immutable audit)
//   assignedTo       string?       Current active worker (mutable)
//   memberIds[]      string[]      All member uids (membership for read; array-contains)
//   memberRoles      Record        Per-member workspace role (admin|member)
//   imageUrl         string?       Avatar / logo path, e.g. "avatars/users/{uid}/main.png"
//   createdAt        string        ISO-8601, set once
//   updatedAt        string?       ISO-8601, touched on every write
//   {purpose}At      string?       ISO-8601, purpose-specific (e.g. completedAt)

// ─── Workspace ──────────────────────────────────────────────────────────────────

export type Workspace = z.infer<typeof WorkspaceSchema>;
// export interface Workspace {
//   id: string;
//   name: string;
//   ownerId: string;                    // head / primary admin (always a member)
//   memberIds: string[];                // all member uids incl. owner
//   memberRoles: Record<string, WorkspaceRole>; // per-member role within THIS workspace
//   imageUrl?: string;                  // "avatars/workspaces/{workspaceId}/main.png"
//   createdAt: string;                  // ISO-8601
// }

// ─── Task ───────────────────────────────────────────────────────────────────────

export type Task = z.infer<typeof TaskSchema>;
// export interface Task {
//   id: string;
//   workspaceId: string;   // parent workspace (denormalized for collectionGroup queries)
//   title: string;
//   description?: string;
//   status: TaskStatus;
//   priority: TaskPriority;
//   ownerId: string;       // who created it (a workspace admin)
//   createdBy: string;     // original author (immutable audit) — == ownerId on create
//   assignedTo?: string;   // the member working it now (initiates, writes notes)
//   progressNote?: string;
//   completionNote?: string;
//   createdAt: string;     // ISO-8601
//   updatedAt: string;     // ISO-8601
//   completedAt?: string;  // ISO-8601, set when status → "done"
// }

// ─── UserProfile — pure display profile, NO global roles ───────────────────────

export type UserProfile = z.infer<typeof UserSchema>;


// export interface UserProfile {
//   uid: string;             // Firebase Auth UID, = document ID
//   email: string;
//   fullName: string;
//   imageUrl?: string;       // "avatars/users/{uid}/main.png"
//   createdAt: string;       // ISO-8601
//   updatedAt: string;       // ISO-8601
// }
