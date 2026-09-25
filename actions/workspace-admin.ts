"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/firebase/auth-server";
import { ensureUserProfile } from "@/actions/user-profile";
import { isSuperuser, isAdminOfWorkspace } from "@/lib/firebase/role-manager";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import type { TaskPriority } from "@/types/taskpulse";

async function assertCanManageWs(workspaceId: string): Promise<string> {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("Unauthorized");
  const isSuper = await isSuperuser(caller.uid);
  if (!isSuper) {
    const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
    if (!wsSnap.exists) throw new Error(`Workspace ${workspaceId} not found.`);
    const wsData = wsSnap.data()!;
    if (!isAdminOfWorkspace({ ownerId: wsData.ownerId, memberRoles: wsData.memberRoles ?? {} }, caller.uid)) {
      throw new Error("Forbidden: workspace admin required.");
    }
  }
  return caller.uid;
}

/** Workspace admin or superuser: adds a new member to the workspace. */
export async function addMember(
  workspaceId: string,
  memberEmail: string,
  role: "admin" | "member" = "member"
) {
  await assertCanManageWs(workspaceId);

  // Look up the uid from email
  const authUser = await adminAuth.getUserByEmail(memberEmail.trim());
  const uid = authUser?.uid;
  if (!uid) {
    // User doesn't exist yet in Firebase Auth — they need to sign in first
    throw new Error(`No Firebase Auth user found with email: ${memberEmail}.`);
  }
  
  await ensureUserProfile(uid);
  
  const wsRef = adminDb.doc(`workspaces/${workspaceId}`);
  await wsRef.update({
    [`memberRoles.${uid}`]: role,
    memberIds: FieldValue.arrayUnion(uid),
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  revalidatePath("/dashboard");
  return { success: true, data: { workspaceId, uid, role } };
}

/** Workspace admin or superuser: removes a member from the workspace. */
export async function removeMember(workspaceId: string, uid: string) {
  await assertCanManageWs(workspaceId);
  
  const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
  if (!wsSnap.exists) throw new Error("Workspace not found.");
  const wsData = wsSnap.data()!;
  
  const memberIds: string[] = wsData.memberIds ?? [];
  const memberRoles: Record<string, string> = wsData.memberRoles ?? {};
  
  if (!memberIds.includes(uid)) throw new Error("User is not a member of this workspace.");
  if (memberRoles[uid] === "admin" && memberIds.filter(id => memberRoles[id] === "admin").length <= 1) {
    throw new Error("Cannot remove the last workspace admin.");
  }
  
  const updatedMemberIds = memberIds.filter(id => id !== uid);
  delete memberRoles[uid];
  
  await adminDb.doc(`workspaces/${workspaceId}`).update({
    memberIds: updatedMemberIds,
    memberRoles,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  revalidatePath("/dashboard");
  return { success: true, data: { workspaceId, uid } };
}

/** Workspace admin or superuser: changes a member's role within the workspace. */
export async function setMemberRole(workspaceId: string, uid: string, role: "admin" | "member") {
  await assertCanManageWs(workspaceId);
  
  const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
  if (!wsSnap.exists) throw new Error("Workspace not found.");
  const wsData = wsSnap.data()!;
  const memberIds: string[] = wsData.memberIds ?? [];
  const memberRoles: Record<string, string> = { ...(wsData.memberRoles ?? {}) };
  
  if (!memberIds.includes(uid)) throw new Error("User is not a member of this workspace.");
  
  // Prevent demoting the last admin
  if (memberRoles[uid] === "admin" && role === "member" 
      && memberIds.filter(id => memberRoles[id] === "admin").length <= 1) {
    throw new Error("Cannot demote the last workspace admin.");
  }
  
  memberRoles[uid] = role;
  
  await adminDb.doc(`workspaces/${workspaceId}`).update({
    memberRoles,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  revalidatePath("/dashboard");
  return { success: true, data: { workspaceId, uid, role } };
}

/**
 * Workspace admin: creates a task in this workspace, optionally assigned to a member.
 * `assignedTo` must be a current workspace member.
 */
export async function createTask(
  workspaceId: string,
  data: { title: string; description?: string; priority: TaskPriority; assignedTo?: string }
) {
  const callerUid = await assertCanManageWs(workspaceId);
  
  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) throw new Error("Task title cannot be empty.");
  
  // Validate assignedTo is a member
  if (data.assignedTo) {
    const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
    const memberIds: string[] = wsSnap.data()?.memberIds ?? [];
    if (!memberIds.includes(data.assignedTo)) {
      throw new Error("assignedTo must be a current member of this workspace.");
    }
  }
  
  const now = FieldValue.serverTimestamp();
  // Firestore rejects `undefined` values — omit assignedTo when unassigned
  // (the field is optional; rules treat a missing assignedTo as "no assignee").
  const taskData: Record<string, unknown> = {
    title: trimmedTitle,
    description: data.description?.trim() ?? "",
    status: "todo",
    priority: data.priority,
    workspaceId,
    ownerId: callerUid,
    createdBy: callerUid,
    createdAt: now,
    updatedAt: now,
  };
  if (data.assignedTo) taskData.assignedTo = data.assignedTo;

  const taskRef = await adminDb
    .collection("workspaces").doc(workspaceId).collection("tasks")
    .add(taskData);
  
  revalidatePath("/dashboard");
  return { success: true, data: { taskId: taskRef.id } };
}

/** Workspace admin: reassigns a task to a different member. */
export async function assignTask(
  workspaceId: string,
  taskId: string,
  assignedTo: string
) {
  await assertCanManageWs(workspaceId);
  
  const wsSnap = await adminDb.doc(`workspaces/${workspaceId}`).get();
  const memberIds: string[] = wsSnap.data()?.memberIds ?? [];
  if (!memberIds.includes(assignedTo)) {
    throw new Error("assignedTo must be a current member of this workspace.");
  }
  
  await adminDb
    .collection("workspaces").doc(workspaceId).collection("tasks").doc(taskId)
    .update({
      assignedTo,
      updatedAt: FieldValue.serverTimestamp(),
    });
  
  revalidatePath("/dashboard");
  return { success: true, data: { taskId, assignedTo } };
}

/** Workspace admin: deletes a task. */
export async function deleteTask(workspaceId: string, taskId: string) {
  await assertCanManageWs(workspaceId);
  await adminDb
    .collection("workspaces").doc(workspaceId).collection("tasks").doc(taskId)
    .delete();
  revalidatePath("/dashboard");
  return { success: true, data: { taskId } };
}
