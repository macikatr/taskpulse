import "server-only";
import { adminDb } from "./admin";
import { getCurrentUser } from "./auth-server";
import type { Workspace } from "@/types/taskpulse";

/**
 * Reads the SUPERUSER_EMAILS env var (comma-separated email list)
 * and returns true if the caller's email is in the allowlist.
 */
export async function isSuperuser(uid: string): Promise<boolean> {
  const superuserEmails = (process.env.SUPERUSER_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (superuserEmails.length === 0) return false;
  try {
    const snap = await adminDb.doc(`users/${uid}`).get();
    const email = (snap.data()?.email ?? "").toLowerCase();
    return superuserEmails.includes(email);
  } catch {
    return false;
  }
}

export async function assertSuperuser(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized: Must be logged in.");
  if (!await isSuperuser(user.uid)) {
    throw new Error("Forbidden: Superuser (project owner) permission required.");
  }
}

/**
 * Checks if `uid` is a workspace admin (owner OR memberRoles[uid] === "admin").
 * Pure function — pass in the already-fetched workspace doc.
 */
export function isAdminOfWorkspace(ws: Pick<Workspace, "ownerId" | "memberRoles"> | null, uid: string): boolean {
  if (!ws) return false;
  if (ws.ownerId === uid) return true;
  return ws.memberRoles?.[uid] === "admin";
}

/**
 * Checks if `uid` is a member of the workspace.
 */
export function isMemberOfWorkspace(ws: Pick<Workspace, "memberIds"> | null, uid: string): boolean {
  if (!ws) return false;
  return (ws.memberIds ?? []).includes(uid);
}

/**
 * Server-side guard: throws if the caller is not a workspace admin.
 */
export async function assertWorkspaceAdmin(workspaceId: string): Promise<Workspace> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
  if (!wsSnap.exists) throw new Error(`Workspace ${workspaceId} not found.`);
  const ws = wsSnap.data() as Workspace;

  const isSuper = await isSuperuser(user.uid);
  if (!isSuper && !isAdminOfWorkspace(ws, user.uid)) {
    throw new Error("Forbidden: workspace admin or superuser permission required.");
  }
  return ws;
}


/**
 * Server-side guard: throws if the caller is not a member (or admin) of the workspace.
 */
export async function assertWorkspaceMember(workspaceId: string): Promise<Workspace> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (await isSuperuser(user.uid)) {
    const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
    if (!wsSnap.exists) throw new Error(`Workspace ${workspaceId} not found.`);
    return wsSnap.data() as Workspace;
  }

  const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
  if (!wsSnap.exists) throw new Error(`Workspace ${workspaceId} not found.`);
  const ws = wsSnap.data() as Workspace;

  if (!isMemberOfWorkspace(ws, user.uid)) {
    throw new Error("Forbidden: must be a member of this workspace.");
  }
  return ws;
}