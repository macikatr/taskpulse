"use server";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { ensureUserProfile } from "@/actions/user-profile";

// Session expires in 5 days (in milliseconds)
const SESSION_EXPIRES_IN = 60 * 60 * 24 * 5 * 1000;

/**
 * Server Action: Exchanges a verified client ID token for an HTTP-only __session cookie.
 * 
 * Why: Next.js Server Components cannot access browser indexedDB/localStorage.
 * By setting an HTTP-only __session cookie, every request to the Next.js server
 * automatically carries the user's authenticated session.
 */
export async function createSession(idToken: string) {
  try {
    // 1. Verify the ID token (also yields the uid for profile bootstrap)
    const decoded = await adminAuth.verifyIdToken(idToken);

    // 2. Create a session cookie from the verified ID token
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    // 3. Set the HTTP-only cookie using Next.js async cookies API
    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      maxAge: SESSION_EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    // 4. Bootstrap users/{uid} profile doc (idempotent) so server-side role
    //    checks (e.g. isSuperuser reading users/{uid}.email) work from first login.
    await ensureUserProfile(decoded.uid);

    return { success: true };
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // return { success: false, error: (error as Error).message };
    return { success: false, error: errorMessage };
  }
}

/**
 * Server Action: Clears the HTTP-only __session cookie upon logout.
 */
export async function removeSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("__session");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete session cookie:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
