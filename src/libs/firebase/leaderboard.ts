import { collection, getDocs } from "firebase/firestore";

import { getLevelFromXP } from "@/constants/levels";

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

export const getLeaderboard = async (
  currentUid?: string | null,
  limitN: number = 50,
): Promise<LeaderboardEntry[]> => {
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

  return top;
};