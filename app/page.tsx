import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/auth-server";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers } from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold tracking-tight text-white">TaskPulse</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-mono mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Next.js 16 + Firebase Deep Dive Architecture
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight sm:leading-none">
          Master Firebase on modern{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
            Next.js App Router
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Learn the dual-SDK pattern, server-side authentication with session cookies, real-time Firestore listeners, airtight security rules, and local emulator workflows.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
          >
            <span>Launch TaskPulse</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="font-semibold text-sm text-white">Dual-SDK Pattern</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Client SDK for reactive browser events; Admin SDK for privileged server-side rendering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Zap className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-sm text-white">__session Cookies</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              XSS-safe HTTP-only session cookies enabling instant server-side page loads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Layers className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="font-semibold text-sm text-white">Real-Time Firestore</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Live multi-tab collaboration synced via WebSocket listeners and security rules.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        TaskPulse • Built with Next.js 16 & Firebase Modular SDK
      </footer>
    </div>
  );
}
