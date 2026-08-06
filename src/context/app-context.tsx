import { UserProfile } from "@/libs/firebase/users";
import { Habit } from "@/libs/sqlite/habits";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/libs/firebase";
import {
  ensureUserProfile,
  getUserProfile,
  hasUserProfile,
  updateUserProfile,
} from "@/libs/firebase/users";
import { exchangeGoogleResponse, useGoogleAuth } from "@/libs/firebase/google";
import { useNetworkStatus } from "@/libs/network";
import { syncOfflineQueue } from "@/libs/offline/sync";
import { clearQueue, enqueueOp, queueLength } from "@/libs/offline/queue";
import { clearAllCache, getCache, setCache } from "@/libs/storage";

type PostType = {
  id: string;
  text: string;
  likesCount?: number;
};

export type GoogleSignInOutcome =
  | { type: "success" }
  | { type: "needs_profile" } // new account — finish profile setup
  | { type: "cancelled" }
  | { type: "error"; error: string };

type AppContextType = {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;

  /** Central place to update the user across the whole app (context + DB + cache). */
  updateUser: (patch: Partial<UserProfile>) => Promise<void>;
  /** Re-pull the current user's profile from Firestore into context. */
  refreshUser: () => Promise<void>;

  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;

  posts: PostType[];
  setPosts: React.Dispatch<React.SetStateAction<PostType[]>>;

  /** true once the auth bootstrap has completed (user either loaded or not). */
  initializing: boolean;

  /** live connectivity status. */
  isOnline: boolean;
  /** number of offline writes waiting to sync. */
  pendingSync: number;
  /** attempt to flush the offline queue (returns remaining pending). */
  flushOfflineQueue: () => Promise<number>;

  /** Trigger Google sign-in. Resolves with the outcome to drive navigation. */
  signInWithGoogle: () => Promise<GoogleSignInOutcome>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

const cacheKey = (uid: string) => `user.${uid}`;

type ProviderProps = {
  children: ReactNode;
};

/**
 * Hydrate a user profile with short retry/backoff. On first sign-up the new
 * Firestore doc may not have replicated yet; without retrying, the home screen
 * would render with no user data.
 */
function hydrateWithRetry(
  uid: string,
  setUser: (u: UserProfile | null) => void,
): () => Promise<UserProfile | null> {
  return async () => {
    let attempt = 0;
    while (attempt < 6) {
      try {
        const profile = await getUserProfile(uid);
        if (profile) {
          setUser(profile);
          await setCache(cacheKey(uid), profile);
          return profile;
        }
      } catch {
        /* transient — retry */
      }
      attempt += 1;
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }
    // Fall back to the last cached copy so the UI is still usable offline.
    const cached = await getCache<UserProfile>(cacheKey(uid));
    if (cached) setUser(cached);
    return cached;
  };
}

export default function AppProvider({ children }: ProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  const isOnline = useNetworkStatus();
  const { request, promptAsync } = useGoogleAuth();

  const hydrateUser = useCallback(
    (uid: string) => hydrateWithRetry(uid, setUser)(),
    [],
  );

  const refreshUser = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUser(profile);
        await setCache(cacheKey(user.uid), profile);
      }
    } catch (err) {
      console.error("refreshUser error:", err);
    }
  }, [user?.uid]);

  const updateUser = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!user?.uid) return;

      // Optimistic update so the whole app reflects the change immediately.
      setUser((prev) => (prev ? { ...prev, ...patch } : prev));
      await setCache(cacheKey(user.uid), { ...user, ...patch });

      try {
        if (isOnline) {
          await updateUserProfile(user.uid, patch);
        } else {
          await enqueueOp({
            type: "update_profile",
            payload: { uid: user.uid, data: patch },
          });
        }
        setPendingSync(await queueLength());
      } catch (err) {
        console.error("updateUser error:", err);
      }
    },
    [user, isOnline],
  );

  // Auth bootstrap: hydrate the user (or clear) on auth changes.
  const bootstrap = useCallback(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await hydrateUser(fbUser.uid);
      } else {
        setUser(null);
        await clearAllCache();
      }
      setInitializing(false);
    });
    return unsub;
  }, [hydrateUser]);

  useEffect(() => {
    const unsub = bootstrap();
    return unsub;
  }, [bootstrap]);

  // Sync the offline queue whenever connectivity returns.
  useEffect(() => {
    if (isOnline) {
      syncOfflineQueue()
        .then(setPendingSync)
        .catch((e) => console.warn("offline sync failed", e));
    } else {
      queueLength().then(setPendingSync).catch(() => {});
    }
  }, [isOnline]);

  const flushOfflineQueue = useCallback(async () => {
    const remaining = await syncOfflineQueue();
    setPendingSync(remaining);
    return remaining;
  }, []);

  const signInWithGoogle = useCallback(
    async (): Promise<GoogleSignInOutcome> => {
      if (!request) {
        return {
          type: "error",
          error:
            "Google Sign-In is not configured. Add your Google client IDs to .env.",
        };
      }

      const result = await promptAsync();
      if (!result || result.type !== "success") {
        return { type: "cancelled" };
      }

      const exchange = await exchangeGoogleResponse(result, hasUserProfile);
      if (!exchange.success) {
        return { type: "error", error: exchange.error || "Sign-in failed." };
      }

      if (exchange.isNewUser) {
        // Ensure a minimal profile exists so home has data on first sign-in.
        await ensureUserProfile(exchange.user.uid, exchange.user.email || "");
        await hydrateUser(exchange.user.uid);
        return { type: "needs_profile" };
      }

      await hydrateUser(exchange.user.uid);
      return { type: "success" };
    },
    [request, promptAsync, hydrateUser],
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    setUser(null);
    await clearAllCache();
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      user,
      setUser,
      updateUser,
      refreshUser,
      habits,
      setHabits,
      posts,
      setPosts,
      initializing,
      isOnline,
      pendingSync,
      flushOfflineQueue,
      signInWithGoogle,
      logout,
    }),
    [
      user,
      updateUser,
      refreshUser,
      habits,
      posts,
      initializing,
      isOnline,
      pendingSync,
      flushOfflineQueue,
      signInWithGoogle,
      logout,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
};
