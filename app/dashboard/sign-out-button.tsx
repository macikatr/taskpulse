"use client";

import { useAuth } from "@/lib/firebase/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{loading ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
