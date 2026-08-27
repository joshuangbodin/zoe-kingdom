import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  type User as GoogleUser,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential, signOut, User } from "firebase/auth";
import { auth } from "./index";

/**
 * Google Sign-In uses the native `@react-native-google-signin/google-signin`
 * module instead of `expo-auth-session`. This avoids the `redirect_url` /
 * callback-scheme problems seen in Expo Go and on Android, and lets us check
 * Google Play Services before signing in.
 *
 * Configured from .env:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   (Android — the OAuth "Web client" ID)
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID   (iOS client ID)
 */
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined,
  // We authenticate with Firebase directly, so we don't need an offline
  // server-auth code / refresh token.
  offlineAccess: false,
});

export type GoogleSignInResult =
  | { success: true; user: User; isNewUser: boolean }
  | { success: false; error?: string; cancelled?: boolean };

/** Maps a native sign-in error into a user-facing message. */
function describeGoogleError(error: any): { cancelled: boolean; message: string } {
  if (isErrorWithCode(error)) {
    const code = error.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      return { cancelled: true, message: "Sign-in was cancelled." };
    }
    if (code === statusCodes.IN_PROGRESS) {
      return { cancelled: false, message: "Sign-in already in progress." };
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        cancelled: false,
        message: "Google Play Services are not available on this device.",
      };
    }
    return { cancelled: false, message: error.message || String(error) };
  }
  return { cancelled: false, message: error?.message || String(error || "Google sign-in failed.") };
}

/**
 * Check that Google Play Services are available (Android). Shows Google's
 * built-in "install / update" dialog if they are missing or out of date.
 * On iOS this always resolves true.
 */
export async function ensurePlayServices(): Promise<void> {
  const available = await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });
  if (!available) {
    throw new Error(statusCodes.PLAY_SERVICES_NOT_AVAILABLE);
  }
}

/**
 * Sign in with Google natively, then exchange the id-token for a Firebase
 * credential. Detects cancelled flows and Play Services availability.
 * Returns whether the account is new (no Firestore profile yet).
 */
export async function signInWithGoogleNative(
  hasProfile: (uid: string) => Promise<boolean>,
): Promise<GoogleSignInResult> {
  try {
    await ensurePlayServices();
  } catch (err) {
    const parsed = describeGoogleError(err);
    return { success: false, cancelled: parsed.cancelled, error: parsed.message };
  }

  let googleUser: GoogleUser | undefined;
  try {
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") {
      return { success: false, cancelled: true, error: "Sign-in was cancelled." };
    }
    googleUser = response.data;
  } catch (err) {
    const parsed = describeGoogleError(err);
    return { success: false, cancelled: parsed.cancelled, error: parsed.message };
  }

  const idToken = googleUser?.idToken;
  if (!idToken) {
    return { success: false, error: "No id token returned from Google." };
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCred = await signInWithCredential(auth, credential);
  const isNewUser = !(await hasProfile(userCred.user.uid));

  return { success: true, user: userCred.user, isNewUser };
}

/**
 * Sign out of both Google (native) and Firebase.
 */
export async function nativeSignOut(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* ignore native sign-out failures — Firebase sign-out is what matters */
  }
  await signOut(auth);
}
