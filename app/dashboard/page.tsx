import { getCurrentUser } from "@/lib/firebase/auth-server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { ShieldCheck, User as UserIcon, Server, Database, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  // 1. Authenticate the request on the server via session cookie
  const user = await getCurrentUser();

  // 2. Server-side redirect if not authenticated (Zero client flash!)
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold tracking-tight text-white">TaskPulse</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Server Authenticated
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.email}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome, {user.name || user.email?.split("@")[0] || "Developer"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            This dashboard was rendered completely on the server using the Next.js App Router and the Firebase Admin SDK.
          </p>
        </div>

        {/* Technical Architecture Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-sm text-white">Server Components (RSC)</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Rendered on Node.js runtime. Validated with <code className="text-indigo-300">verifySessionCookie()</code> before HTML was sent to your browser.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
              Zero client hydration flash
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-sm text-white">HTTP-Only __session</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cookie is inaccessible to JavaScript (XSS-safe) and automatically transmitted with server actions and page requests.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
              5-day session lifetime
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-sm text-white">Dual-SDK Ready</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Client SDK handles live snapshot listeners, while Admin SDK performs fast batch reads & privileged operations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
              Next: Real-time Task Board
            </div>
          </div>
        </div>

        {/* User Claims Debug Inspector */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Server-Verified User Claims</h2>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </main>
    </div>
  );
}
