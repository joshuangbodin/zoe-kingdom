import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Reuse an already-initialized app (e.g. under Expo Fast Refresh) instead of
// throwing "Firebase: Error (app/duplicate-app)".
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * ✅ CORRECT RN AUTH (persistent) — with a guard against re-initialization.
 *
 * `initializeAuth` throws `auth/already-initialized` when the module re-evaluates
 * (Expo Fast Refresh / double import) after an auth instance already exists.
 * We catch that and fall back to the existing instance so the app never crashes
 * on hot reload.
 */
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
  // Already initialized — reuse the live instance (keeps the same persistence).
  auth = getAuth(app);
}

export { auth };

// getFirestore is memoized, so calling it again is safe and returns the same db.
export const db = getFirestore(app);
