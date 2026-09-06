import "server-only";
import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  // If the key is wrapped in quotes, strip them
  const unquoted = key.replace(/^["']|["']$/g, "");
  // Replace escaped newlines with actual newline characters
  return unquoted.replace(/\\n/g, "\n");
}

function initAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  // Fallback: Default application credentials (e.g. running on Google Cloud / Firebase App Hosting)
  return initializeApp();
}

export const adminApp = initAdmin();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
