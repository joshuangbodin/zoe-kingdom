import { collection, getDocs } from "firebase/firestore";

import { getLevelFromXP } from "@/constants/levels";
import { getCache, setCache } from "@/libs/storage";

import { db } from "./index";
import type { UserProfile } from "./users";

/**
 * Global XP leaderboard.
 *
 * Ranks users by their `seasonXP` (lifetime XP), which is snapshotted onto the
 * `users/{uid}` profile doc every time the user runs a manual "Sync now" (see
 * `src/libs/sync/sync.ts`). Fetching the whole collection and sorting on-device
 * mirrors the existing `getAllUsersSortedByLastUpload` pattern and avoids
 * needing a composite Firestore index.
 *
 * The app is offline-first, so the last successfully-fetched snapshot is cached
 * in AsyncStorage. When the fetch fails (or we're offline) the cached snapshot
 * is returned instead — flagged with `fromCache` so the UI can show a subtle
 * notice instead of an empty board.
 */

export type LeaderboardEntry = {
  uid: string;
  username: string;
  avatar: number;
  seasonXP: number;
  level: number;
  rank: number;
  isYou: boolean;
};

export type LeaderboardResult = {
  entries: LeaderboardEntry[];
  /** True when we served the last good snapshot because the live fetch failed. */
  fromCache: boolean;
};

const LEADERBOARD_CACHE_KEY = "leaderboard.snapshot";

export const getLeaderboard = async (
  currentUid?: string | null,
  limitN: number = 50,
): Promise<LeaderboardResult> => {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    const users: UserProfile[] = snapshot.docs.map((d) => ({
      ...(d.data() as UserProfile),
      uid: d.id,
    }));

    const ranked = users
      .map((u) => ({
        uid: u.uid,
        username: u.username ?? "User",
        avatar: u.avatar ?? 0,
        seasonXP: Number(u.seasonXP || 0),
      }))
      .sort((a, b) => b.seasonXP - a.seasonXP)
      .map((u, idx) => ({
        ...u,
        level: getLevelFromXP(u.seasonXP),
        rank: idx + 1,
        isYou: u.uid === currentUid,
      }));

    const top = ranked.slice(0, limitN);

    // Always surface the current user's own row, even if they're outside the
    // top slice, so players can see exactly where they stand.
    if (currentUid && !top.some((e) => e.uid === currentUid)) {
      const you = ranked.find((e) => e.uid === currentUid);
      if (you) top.push(you);
    }

    // Persist the snapshot so it's available offline. `isYou` is intentionally
    // recomputed on read so a cached copy never leaks another user's highlight.
    await setCache(LEADERBOARD_CACHE_KEY, top);

    return { entries: top, fromCache: false };
  } catch {
    // Offline / transient read failure — fall back to the last good snapshot.
    const cached = (await getCache<LeaderboardEntry[]>(LEADERBOARD_CACHE_KEY)) ??
      [];

    return {
      entries: cached.map((e) => ({ ...e, isYou: e.uid === currentUid })),
      fromCache: true,
    };
  }
};