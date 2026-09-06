import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface ServerUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}

/**
 * Reads the HTTP-only `__session` cookie and verifies it using the Firebase Admin SDK.
 * In Next.js 15/16, `cookies()` is an async promise that must be awaited.
 * 
 * Returns the verified user payload or null if unauthenticated/expired.
 */
export async function getCurrentUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // checkRevoked: true checks whether the user was logged out or disabled
    const decodedToken: DecodedIdToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    // Session cookie is invalid, expired, or revoked
    return null;
  }
}
