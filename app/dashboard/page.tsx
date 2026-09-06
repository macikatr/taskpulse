import { getCurrentUser } from "@/lib/firebase/auth-server";
import { getUserWorkspaces } from "@/actions/workspace";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { WorkspaceClient } from "./workspace-client";
import { Sparkles, Server, ShieldCheck, Database, Code2 } from "lucide-react";

export default async function DashboardPage() {
  // 1. Server-side session verification via Admin SDK
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Server-side pre-rendering with Admin SDK
  // Fetches workspaces before HTML is streamed to the browser
  const initialWorkspaces = await getUserWorkspaces();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold tracking-tight text-white">TaskPulse</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Live Sync Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.email}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Workspace Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Workspaces pre-rendered on the server via <code className="text-indigo-400">firebase-admin</code>; tasks synchronized in real-time via <code className="text-indigo-400">onSnapshot</code>.
          </p>
        </div>

        {/* Real-Time Interactive Kanban Board */}
        <WorkspaceClient
          initialWorkspaces={initialWorkspaces}
          currentUserUid={user.uid}
        />

        {/* Deep Dive Architecture Reference */}
        <div className="pt-8 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Under the Hood: Dual-SDK Flow for This Page
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1.5">
                <Server className="w-4 h-4" />
                <span>1. Server Pre-Render</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Next.js Server Component fetched workspaces from Firestore using the Admin SDK. The initial HTML already includes the workspace metadata.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1.5">
                <Database className="w-4 h-4" />
                <span>2. WebSocket Listener</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The Client SDK mounted an <code className="text-emerald-300">onSnapshot</code> listener to the active workspace subcollection. Any change immediately streams over WebSockets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Direct Client Mutation</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Clicking status changes calls <code className="text-amber-300">updateDoc()</code> directly to Firestore from the browser, benefiting from instant optimistic UI.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
