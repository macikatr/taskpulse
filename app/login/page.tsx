"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-client";
import { LogIn, Sparkles, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Auth error:", err);
      // Clean up Firebase error messages for user readability
      let message = err.message || "An unexpected error occurred.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters.";
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TaskPulse</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isSignUp ? "Create a new collaborative account" : "Sign in to your collaborative workspace"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={submitting}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 transition font-medium text-sm text-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">Or with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-medium text-sm text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <span>Connecting...</span>
            ) : isSignUp ? (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle sign up / sign in */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1"
          >
            {isSignUp ? "Sign In" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
