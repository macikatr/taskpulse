const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/user-not-found": "Invalid email or password.",
};

/**
 * Converts a raw Firebase auth error into a user-friendly message.
 */
export function getAuthErrorMessage(err: unknown): string {
  const defaultMessage = "An unexpected error occurred.";

  // Type guard to ensure err is an object we can inspect
  if (!err || typeof err !== "object") {
    return defaultMessage;
  }

  // Cast to safely read properties
  const errorObj = err as Record<string, unknown>;

  // 1. Check if the error code matches our custom dictionary
  if (typeof errorObj.code === "string" && errorObj.code in FIREBASE_AUTH_ERRORS) {
    return FIREBASE_AUTH_ERRORS[errorObj.code];
  }

  // 2. Fallback to the original error message if it exists
  if (typeof errorObj.message === "string") {
    return errorObj.message;
  }

  return defaultMessage;
}