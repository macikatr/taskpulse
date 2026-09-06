"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onIdTokenChanged,
} from "firebase/auth";
import { auth } from "./client";
import { createSession, removeSession } from "@/actions/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged fires:
    // 1. Immediately on initial load with the current user state from indexedDB
    // 2. On sign in / sign out
    // 3. Every hour when Firebase auto-refreshes the ID token
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          // Sync token to HTTP-only __session cookie for Next.js Server Components
          await createSession(idToken);
        } catch (err) {
          console.error("Failed to sync session with server:", err);
        }
      } else {
        // Clear session cookie on server
        await removeSession();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await removeSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
