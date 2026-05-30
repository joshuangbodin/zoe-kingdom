import { FirebaseError } from "firebase/app";

export const FIREBASE_ERROR_MAP: Record<string, string> = {
  "auth/email-already-in-use":
    "This email is already registered. Try logging in.",

  "auth/invalid-email":
    "Please enter a valid email address.",

  "auth/weak-password":
    "Password must be at least 6 characters.",

  "auth/user-not-found":
    "No account found with this email.",

  "auth/wrong-password":
    "Incorrect password. Try again.",

  "auth/too-many-requests":
    "Too many attempts. Please wait a bit.",

  "auth/network-request-failed":
    "Network issue. Check your connection.",
};

export const getFirebaseErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    return FIREBASE_ERROR_MAP[error.code] || "Something went wrong.";
  }

  return "Unexpected error occurred.";
};