export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string; // Serialized ISO string for RSC safety
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  createdBy: string;
  createdAt: string; // Serialized ISO string
  updatedAt: string; // Serialized ISO string
}
