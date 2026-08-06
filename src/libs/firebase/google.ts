import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential, User } from "firebase/auth";
import { auth } from "./index";

WebBrowser.maybeCompleteAuthSession();

/**
 * Google Sign-In configuration.
 *
 * Set these in your .env (they are the OAuth client IDs from the Firebase /
 * Google Cloud console for the "Web application", "iOS", "Android" and Expo
 * clients):
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (optional, for Expo Go / Android)
 */
const config = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as
    | string
    | undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as
    | string
    | undefined,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID as
    | string
    | undefined,
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID as
    | string
    | undefined,
  selectAccount: true,
};

/** React hook exposing the Google auth request + promptAsync trigger. */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest(config);
  return { request, response, promptAsync };
}

export type GoogleSignInResult =
  | { success: true; user: User; isNewUser: boolean }
  | { success: false; error?: string };

/**
 * Exchange an OAuth response's id-token for a Firebase credential and sign in.
 * Returns whether the account is new (no Firestore profile yet).
 */
export async function exchangeGoogleResponse(
  response: any,
  hasProfile: (uid: string) => Promise<boolean>,
): Promise<GoogleSignInResult> {
  if (response?.type !== "success") {
    return {
      success: false,
      error:
        response?.type === "dismiss"
          ? "Sign-in was cancelled."
          : "Google sign-in failed. Please try again.",
    };
  }

  const idToken = response.params?.id_token;
  if (!idToken) {
    return { success: false, error: "No id token returned from Google." };
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCred = await signInWithCredential(auth, credential);
  const isNewUser = !(await hasProfile(userCred.user.uid));

  return { success: true, user: userCred.user, isNewUser };
}
