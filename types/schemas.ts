import { z } from "zod"

// export interface UserProfile {
//   uid: string;             // Firebase Auth UID, = document ID
//   email: string;
//   fullName: string;
//   imageUrl?: string;       // "avatars/users/{uid}/main.png"
//   createdAt: string;       // ISO-8601
//   updatedAt: string;       // ISO-8601
// }

export const UserSchema = z.object({
    uid: z.string(),
    email: z.email(),
    fullName: z.string().min(3).toUpperCase(),
    imageUrl: z.string().optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),

})

// export interface Workspace {
//   id: string;
//   name: string;
//   ownerId: string;                    // head / primary admin (always a member)
//   memberIds: string[];                // all member uids incl. owner
//   memberRoles: Record<string, WorkspaceRole>; // per-member role within THIS workspace
//   imageUrl?: string;                  // "avatars/workspaces/{workspaceId}/main.png"
//   createdAt: string;                  // ISO-8601
// }
// export type WorkspaceRole = "admin" | "member";
export const WorkspaceRoleSchema = z.union([z.literal("admin"), z.literal("member")])

export const WorkspaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    memberIds: z.array(z.string()),
    memberRoles: z.record(z.string(), WorkspaceRoleSchema),
    imageUrl: z.string().optional(),
    createdAt: z.iso.datetime(),
})

// export type TaskStatus = "todo" | "in-progress" | "done";
// export type TaskPriority = "low" | "medium" | "high";

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

export const TaskStatusSchema = z.union([z.literal("todo"), z.literal("in-progress"), z.literal("done")])
export const TaskPrioritySchema = z.union([z.literal("low"), z.literal("medium"), z.literal("high")])

export const TaskSchema = z.object({
    id: z.string(),
    workspaceId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: TaskStatusSchema,
    priority: TaskPrioritySchema,
    ownerId: z.string(),
    createdBy: z.string(),
    assignedTo: z.string().optional(),
    progressNote: z.string().optional(),
    completionNote: z.string().optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().optional(),
})

// {
//     "success": true,
//     "cutoff": {
//         "threshold": "0 minute(s)",
//         "isoString": "2026-09-13T22:38:56.685Z",
//         "epochMillis": 1789339136685
//     },
//     "scannedCompletedTasks": 0,
//     "deletedCount": 0,
//     "deletedTasks": [],
//     "indexStatus": "Active (Indexed query)",
//     "indexSetupUrl": null
// }

export const cronResultSchema = z.object({
    success: z.boolean(),
    cutoff : z.object({
        threshold: z.string(),
        isoString: z.iso.datetime(),
        epochMillis: z.number(),
    }),
    scannedCompletedTasks: z.number(),
    deletedCount: z.number(),
    deletedTasks: z.array(z.string()),
    indexStatus: z.string(),
    indexSetupUrl: z.string().optional(),
})