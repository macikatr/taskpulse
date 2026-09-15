"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/firebase/auth-server";
import { ensureUserProfile } from "@/actions/user-profile";
import { isSuperuser } from "@/lib/firebase/role-manager";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import type { Workspace } from "@/types/taskpulse";

/**
 * SUPERUSER-ONLY: Creates a workspace. The superuser (project owner) decides
 * who the initial owner and members are, and assigns the initial "admin" role.
 * Regular authenticated users CANNOT create workspaces.
 */
export async function createWorkspace(
  name: string,
  opts: { ownerId?: string; initialMembers?: Array<{ uid: string; role?: "admin" | "member" }> } = {}
) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("Unauthorized");
  if (!await isSuperuser(caller.uid)) throw new Error("Forbidden: superuser permission required to create a workspace.");

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 50) throw new Error("Workspace name must be 1–50 chars.");

  // The ownerId defaults to the superuser's own uid if not specified
  const ownerId = opts.ownerId ?? caller.uid;
  await ensureUserProfile(ownerId); // profile doc must exist before workspace does

  // Build memberIds + memberRoles
  const memberIds = new Set([ownerId, ...(opts.initialMembers ?? []).map(m => m.uid)]);
  const memberRoles: Record<string, "admin" | "member"> = {};
  for (const uid of memberIds) memberRoles[uid] = "member";
  memberRoles[ownerId] = "admin";  // owner is always admin
  for (const m of (opts.initialMembers ?? [])) {
    if (m.role) memberRoles[m.uid] = m.role;
  }

  const docRef = await adminDb.collection("workspaces").add({
    name: trimmedName,
    ownerId,
    memberIds: [...memberIds],
    memberRoles,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  return { success: true, data: { workspaceId: docRef.id } };
}

/**
 * Reads all workspaces where the current user is a member (or is the owner).
 * Used for server-side pre-rendering in the dashboard page.
 */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const snap = await adminDb
    .collection("workspaces")
    .where("memberIds", "array-contains", user.uid)
    .get();

  return snap.docs.map(doc => {
    const d = doc.data();
    const ts = (t: unknown) =>
      (t as { toDate?: () => Date })?.toDate?.().toISOString() ?? new Date().toISOString();
    return {
      id: doc.id,
      name: d.name,
      ownerId: d.ownerId,
      memberIds: d.memberIds ?? [],
      memberRoles: d.memberRoles ?? {},
      imageUrl: d.imageUrl,
      createdAt: ts(d.createdAt),
    };
  });
}