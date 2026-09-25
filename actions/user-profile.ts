"use server";

import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getCurrentUser } from "@/lib/firebase/auth-server";
import { FieldValue } from "firebase-admin/firestore";
import type { UserProfile } from "@/types/taskpulse";

/**
 * Extracts a "first name" from a full-name string or an email address.
 * e.g., "John Doe" → "john", "john.doe@corp.com" → "john"
 */
function defaultFullName(displayName: string | null, email: string | null, uid: string): string {
  if (displayName && displayName.trim()) return displayName.trim();
  if (email) return email.split("@")[0] || uid;
  return uid;
}

/**
 * Returns the default avatar URL produced by Vercel's avatar service.
 */
function defaultImageUrl(fullName: string): string {
  return `https://avatar.vercel.sh/${encodeURIComponent(fullName)}`;
}

/**
 * Ensures a UserProfile document exists for the given Firebase Auth user.
 * Idempotent: creates on first call; no-ops on subsequent calls.
 * Called at sign-in and at the top of any server action that needs the profile.
 */
export async function ensureUserProfile(uid: string): Promise<UserProfile> {
  const ref = adminDb.doc(`users/${uid}`);
  const existing = await ref.get();
  if (existing.exists) return existing.data() as UserProfile;

  let email = "";
  let displayName = "";
  try {
    const authUser = await adminAuth.getUser(uid);
    email = authUser.email ?? "";
    displayName = authUser.displayName ?? "";
  } catch {
    // User not found in Auth; fall through to defaults
  }

  const fullName = defaultFullName(displayName || null, email || null, uid);
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    email,
    fullName,
    imageUrl: defaultImageUrl(fullName),
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(profile);
  return profile;
}

/** Whitelisted domains for imageUrl. Adjust if adding more. */
const ALLOWED_IMAGE_URLS = [
  /^https:\/\/avatar\.vercel\.sh\//,
  /^https:\/\/firebasestorage\.googleapis\.com\//,
  /^https:\/\/storage\.googleapis\.com\//
];

/**
 * Self-service: updates the authenticated user's own displayName fields (fullName, email, imageUrl).
 * Rejects any attempt to modify `uid`, `createdAt`, `UpdatedAt` (set by serverTimestamp), or any other field.
 */
export async function updateOwnProfile(
  updates: Partial<Pick<UserProfile, "fullName" | "email" | "imageUrl">>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (updates.fullName !== undefined) {
    const trimmed = updates.fullName.trim();
    if (!trimmed) throw new Error("fullName cannot be empty.");
    if (trimmed.length > 100) throw new Error("fullName too long (max 100 chars).");
    patch.fullName = trimmed;
  }

  if (updates.email !== undefined) {
    const trimmed = updates.email.trim();
    if (!trimmed) throw new Error("email cannot be empty.");
    patch.email = trimmed;
  }

  if (updates.imageUrl !== undefined) {
    if (updates.imageUrl === "" || updates.imageUrl == null) {
      // Allow removing the image — Firestore interprets FieldValue.delete() as "remove key"
      patch.imageUrl = FieldValue.delete();
    } else {
      const url = updates.imageUrl as string;
      const isAllowed = ALLOWED_IMAGE_URLS.some(re => re.test(url));
      if (!isAllowed) throw new Error("imageUrl must be from an allowed domain.");
      patch.imageUrl = url;
    }
  }

  await adminDb.doc(`users/${user.uid}`).update(patch);
  return { success: true, data: patch };
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await adminDb.doc(`users/${uid}`).get();
  return snap.exists ? (snap.data() as UserProfile) : null;
}