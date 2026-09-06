"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/firebase/auth-server";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import type { TaskPriority, Workspace } from "@/types/taskpulse";

/**
 * Server Action: Creates a new Workspace using the Admin SDK.
 * Admin SDK bypasses security rules, so we perform authorization checks in server code.
 */
export async function createWorkspace(name: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Must be logged in to create a workspace.");
  }

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 50) {
    throw new Error("Workspace name must be between 1 and 50 characters.");
  }

  const docRef = await adminDb.collection("workspaces").add({
    name: trimmedName,
    ownerId: user.uid,
    memberIds: [user.uid],
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/dashboard");
  return { success: true, workspaceId: docRef.id };
}

/**
 * Server Action: Creates a new Task inside the workspace's tasks subcollection.
 */
export async function createTask(
  workspaceId: string,
  data: {
    title: string;
    description?: string;
    priority: TaskPriority;
  }
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) {
    throw new Error("Task title cannot be empty.");
  }

  // Path: /workspaces/{workspaceId}/tasks/{taskId}
  const taskRef = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("tasks")
    .add({
      title: trimmedTitle,
      description: data.description?.trim() || "",
      status: "todo",
      priority: data.priority,
      workspaceId,
      createdBy: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath("/dashboard");
  return { success: true, taskId: taskRef.id };
}

/**
 * Server function: Retrieves all workspaces where current user is a member.
 * Used for pre-rendering in Server Components.
 */
export async function getUserWorkspaces(): Promise<Workspace[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  // Query using array-contains on memberIds
  const snapshot = await adminDb
    .collection("workspaces")
    .where("memberIds", "array-contains", user.uid)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      ownerId: data.ownerId,
      memberIds: data.memberIds || [],
      // Convert Firestore Timestamp to plain string for RSC serialization
      createdAt: data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
    };
  });
}
