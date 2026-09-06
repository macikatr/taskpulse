"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createWorkspace, createTask } from "@/actions/workspace";
import type { Workspace, Task, TaskStatus, TaskPriority } from "@/types/taskpulse";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  CircleDashed,
  Briefcase,
  Layers,
  FileText,
  CalendarCheck,
  Zap,
  Info,
  X,
} from "lucide-react";

interface WorkspaceClientProps {
  initialWorkspaces: Workspace[];
  currentUserUid: string;
}

export function WorkspaceClient({
  initialWorkspaces,
  currentUserUid,
}: WorkspaceClientProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    initialWorkspaces[0] || null
  );

  // Real-time Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // New Workspace Modal
  const [showWsModal, setShowWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);

  // New Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [creatingTask, setCreatingTask] = useState(false);

  // Note Modal State (Progression & Completion Notes)
  const [noteModal, setNoteModal] = useState<{
    task: Task;
    type: "progress" | "completion";
  } | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Cron Cleanup Modal / Trigger State
  const [cronResult, setCronResult] = useState<any | null>(null);
  const [runningCron, setRunningCron] = useState(false);

  // Keep workspaces updated if initialWorkspaces changes from server
  useEffect(() => {
    setWorkspaces(initialWorkspaces);
    if (!selectedWorkspace && initialWorkspaces.length > 0) {
      setSelectedWorkspace(initialWorkspaces[0]);
    }
  }, [initialWorkspaces, selectedWorkspace]);

  // ===========================================================================
  // REAL-TIME LISTENER: onSnapshot subcollection listener
  // ===========================================================================
  useEffect(() => {
    if (!selectedWorkspace) {
      setTasks([]);
      return;
    }

    setLoadingTasks(true);

    // Path: /workspaces/{workspaceId}/tasks
    const tasksRef = collection(db, "workspaces", selectedWorkspace.id, "tasks");
    const q = query(tasksRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks: Task[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            workspaceId: selectedWorkspace.id,
            title: data.title,
            description: data.description,
            progressNote: data.progressNote,
            completionNote: data.completionNote,
            status: data.status || "todo",
            priority: data.priority || "medium",
            assignedTo: data.assignedTo,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate?.()
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()
              ? data.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
            completedAt: data.completedAt?.toDate?.()
              ? data.completedAt.toDate().toISOString()
              : undefined,
          };
        });

        setTasks(loadedTasks);
        setLoadingTasks(false);
      },
      (error) => {
        console.error("Firestore real-time listener error:", error);
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [selectedWorkspace]);

  // Update Status: When marking "done", record completedAt timestamp
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!selectedWorkspace) return;
    try {
      const taskDocRef = doc(
        db,
        "workspaces",
        selectedWorkspace.id,
        "tasks",
        taskId
      );

      const updateData: Record<string, any> = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "done") {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(taskDocRef, updateData);
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!selectedWorkspace) return;
    try {
      const taskDocRef = doc(
        db,
        "workspaces",
        selectedWorkspace.id,
        "tasks",
        taskId
      );
      await deleteDoc(taskDocRef);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Open Note Modal
  const handleOpenNoteModal = (task: Task, type: "progress" | "completion") => {
    setNoteModal({ task, type });
    setNoteContent(
      type === "progress"
        ? task.progressNote || ""
        : task.completionNote || ""
    );
  };

  // Save Note to Firestore
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !noteModal) return;
    setSavingNote(true);
    try {
      const taskDocRef = doc(
        db,
        "workspaces",
        selectedWorkspace.id,
        "tasks",
        noteModal.task.id
      );

      const payload =
        noteModal.type === "progress"
          ? { progressNote: noteContent.trim(), updatedAt: serverTimestamp() }
          : { completionNote: noteContent.trim(), updatedAt: serverTimestamp() };

      await updateDoc(taskDocRef, payload);
      setNoteModal(null);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  // Trigger Cron Cleanup API Endpoint
  const handleTriggerCron = async (days: number, minutes?: number) => {
    setRunningCron(true);
    setCronResult(null);
    try {
      const url =
        minutes !== undefined
          ? `/api/cron/cleanup-tasks?minutes=${minutes}`
          : `/api/cron/cleanup-tasks?days=${days}`;
      const res = await fetch(url);
      const data = await res.json();
      setCronResult(data);
    } catch (err) {
      console.error("Failed to run cron cleanup:", err);
    } finally {
      setRunningCron(false);
    }
  };

  // Create Workspace Handler
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    try {
      const res = await createWorkspace(newWsName);
      const created: Workspace = {
        id: res.workspaceId,
        name: newWsName.trim(),
        ownerId: currentUserUid,
        memberIds: [currentUserUid],
        createdAt: new Date().toISOString(),
      };
      setWorkspaces((prev) => [...prev, created]);
      setSelectedWorkspace(created);
      setNewWsName("");
      setShowWsModal(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setCreatingWs(false);
    }
  };

  // Create Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedWorkspace) return;
    setCreatingTask(true);
    try {
      await createTask(selectedWorkspace.id, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
      });
      setTaskTitle("");
      setTaskDesc("");
      setShowTaskModal(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setCreatingTask(false);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-red-500/10 text-red-400 border border-red-500/20">
            High
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Selector & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Current Workspace</div>
            {workspaces.length > 0 ? (
              <select
                value={selectedWorkspace?.id || ""}
                onChange={(e) => {
                  const ws = workspaces.find((w) => w.id === e.target.value);
                  if (ws) setSelectedWorkspace(ws);
                }}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id} className="bg-slate-900 text-white">
                    {ws.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-semibold text-slate-400">No workspaces yet</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cron Simulation Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
            <button
              onClick={() => handleTriggerCron(7)}
              disabled={runningCron}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              title="Run 7-day cleanup job"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cron: Clean &gt; 7 Days</span>
            </button>
            <button
              onClick={() => handleTriggerCron(0, 0)}
              disabled={runningCron}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition disabled:opacity-50"
              title="Demo: Delete all completed tasks immediately"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Cleanup Now</span>
            </button>
          </div>

          <button
            onClick={() => setShowWsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workspace
          </button>
          {selectedWorkspace && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Cron Result Inspection Banner */}
      {cronResult && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              Cron Cleanup Executed Successfully!
            </div>
            <p className="text-slate-300">
              Threshold: <span className="font-mono text-indigo-300">{cronResult.cutoff?.threshold}</span> • 
              Cutoff ISO String: <span className="font-mono text-indigo-300">{cronResult.cutoff?.isoString}</span>
            </p>
            <p className="text-slate-400">
              Scanned: {cronResult.scannedCompletedTasks} completed task(s) • Deleted: {cronResult.deletedCount} task(s).
            </p>
          </div>
          <button
            onClick={() => setCronResult(null)}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* If No Workspace Exists */}
      {workspaces.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Workspaces Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Workspaces partition your data in Firestore. Create your first workspace to start adding tasks with real-time sync.
          </p>
          <button
            onClick={() => setShowWsModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      ) : (
        /* Real-Time Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: To Do */}
          <TaskColumn
            title="To Do"
            icon={<CircleDashed className="w-4 h-4 text-slate-400" />}
            count={tasks.filter((t) => t.status === "todo").length}
            tasks={tasks.filter((t) => t.status === "todo")}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onOpenNote={handleOpenNoteModal}
            getPriorityBadge={getPriorityBadge}
            targetStatus="in-progress"
            nextActionLabel="Start"
          />

          {/* Column 2: In Progress */}
          <TaskColumn
            title="In Progress"
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            count={tasks.filter((t) => t.status === "in-progress").length}
            tasks={tasks.filter((t) => t.status === "in-progress")}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onOpenNote={handleOpenNoteModal}
            getPriorityBadge={getPriorityBadge}
            targetStatus="done"
            nextActionLabel="Complete"
          />

          {/* Column 3: Done */}
          <TaskColumn
            title="Done"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            count={tasks.filter((t) => t.status === "done").length}
            tasks={tasks.filter((t) => t.status === "done")}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTask}
            onOpenNote={handleOpenNoteModal}
            getPriorityBadge={getPriorityBadge}
            targetStatus="todo"
            nextActionLabel="Reopen"
          />
        </div>
      )}

      {/* Real-time Indicator Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-800/80 pt-4 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time onSnapshot WebSocket Active</span>
        </div>
        <div>
          Subcollection: <code className="text-slate-400">/workspaces/{selectedWorkspace?.id || "*"}/tasks</code>
        </div>
      </div>

      {/* Modal: Progression / Completion Note */}
      {noteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">
              {noteModal.type === "progress" ? "Progression Notes" : "Completion Notes"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {noteModal.type === "progress"
                ? `Record active progress details for "${noteModal.task.title}".`
                : `Record post-completion summary for "${noteModal.task.title}".`}
            </p>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <textarea
                  rows={4}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={
                    noteModal.type === "progress"
                      ? "e.g., Currently refactoring the token exchange service action..."
                      : "e.g., Implemented and tested against multi-tenant isolation rules."
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Workspace */}
      {showWsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">Create Workspace</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter a name for your team workspace.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="Engineering Team"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWsModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {creatingWs ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">New Task</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new task to {selectedWorkspace?.name}.
            </p>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Build Firestore security rules"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Add initial details, background context..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  {creatingTask ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Column on the Kanban Board
function TaskColumn({
  title,
  icon,
  count,
  tasks,
  onUpdateStatus,
  onDelete,
  onOpenNote,
  getPriorityBadge,
  targetStatus,
  nextActionLabel,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tasks: Task[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onOpenNote: (task: Task, type: "progress" | "completion") => void;
  getPriorityBadge: (priority: TaskPriority) => React.ReactNode;
  targetStatus: TaskStatus;
  nextActionLabel: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col min-h-[420px]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </h4>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
          {count}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {tasks.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-slate-600 italic">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 transition group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="text-sm font-medium text-white leading-snug">
                    {task.title}
                  </h5>
                  {getPriorityBadge(task.priority)}
                </div>

                {/* State-dependent content rendering */}
                {task.status === "todo" && task.description && (
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                    {task.description}
                  </p>
                )}

                {task.status === "in-progress" && (
                  <div className="mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-0.5">
                      Progression Notes
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {task.progressNote || (
                        <span className="italic text-slate-500">
                          No progression notes recorded yet.
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {task.status === "done" && (
                  <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-0.5">
                      Completion Notes
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {task.completionNote || (
                        <span className="italic text-slate-500">
                          Completed without extra notes.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-700/40 text-xs">
                {/* Left: Next status advance */}
                <button
                  onClick={() => onUpdateStatus(task.id, targetStatus)}
                  className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
                >
                  {nextActionLabel} &rarr;
                </button>

                {/* Right: Add Note button (for in-progress and done) + Delete */}
                <div className="flex items-center gap-2">
                  {task.status === "in-progress" && (
                    <button
                      onClick={() => onOpenNote(task, "progress")}
                      className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{task.progressNote ? "Edit Note" : "+ Add Note"}</span>
                    </button>
                  )}

                  {task.status === "done" && (
                    <button
                      onClick={() => onOpenNote(task, "completion")}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{task.completionNote ? "Edit Note" : "+ Add Note"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
