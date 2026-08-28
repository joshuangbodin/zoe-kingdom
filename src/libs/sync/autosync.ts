import {
  uploadLogs,
  uploadProgress,
} from "@/libs/firebase/progress";
import { updateUserSeasonXP } from "@/libs/firebase/users";
import { getChallengeXPRewarded } from "@/libs/sqlite/challenges";
import { getYearContributions } from "@/libs/sqlite/contributions";
import { sqlite } from "@/libs/sqlite/db";
import { getSpiritState } from "@/libs/sqlite/spirit";

/**
 * Automatic, incremental sync of locally-logged habit completions.
 *
 * The app is offline-first: habit completions are always written to local
 * SQLite first (with `synced = 0`). This function picks up whatever hasn't
 * been uploaded yet and pushes it to Firestore so users don't have to hit the
 * manual "Sync now" button. It is deliberately light:
 *
 *   1. Reads only the rows where `synced = 0`.
 *   2. Uploads just those logs (idempotent by log id).
 *   3. Marks them `synced = 1` in SQLite.
 *   4. Recomputes the deterministic XP total and snaps `seasonXP` + the
 *      aggregate progress snapshot, keeping the leaderboard current.
 *
 * If a write fails (e.g. transient network blip) the rows stay `synced = 0`,
 * so the next autosync — or the reconnect effect in AppProvider — retries.
 */

export const syncUnsyncedLogsAutomatically = async (
  uid: string,
): Promise<number> => {
  try {
    const unsynced: any[] = await sqlite.getAllAsync(
      "SELECT * FROM habit_logs WHERE synced = 0",
    );

    if (unsynced.length === 0) return 0;

    await uploadLogs(uid, unsynced);

    for (const l of unsynced) {
      await sqlite.runAsync(
        "UPDATE habit_logs SET synced = 1 WHERE id = ?",
        [l.id],
      );
    }

    // Recompute deterministic totals (habit XP + challenge XP).
    const logs: any[] = await sqlite.getAllAsync(
      "SELECT xpEarned FROM habit_logs",
    );
    const totalXP =
      logs.reduce((sum, l) => sum + (Number(l.xpEarned) || 0), 0) +
      (await getChallengeXPRewarded());
    const level = Math.floor(Math.sqrt(totalXP / 10)) + 1;

    const spirit: any = await getSpiritState();
    const spiritStage = spirit?.spiritStage ?? "";

    // Keep the community leaderboard in sync with real earned XP.
    await updateUserSeasonXP(uid, totalXP);

    // Refresh the aggregate progress snapshot (level + contribution graph).
    const year = new Date().getFullYear();
    const contributions: Record<string, number> = {};
    for (const day of await getYearContributions(year)) {
      if (day.count > 0) contributions[day.date] = day.count;
    }
    await uploadProgress(uid, {
      totalXP,
      level,
      spiritStage,
      contributions,
    });

    return unsynced.length;
  } catch (err) {
    // Leave rows as `synced = 0` so they retry later; never crash the caller.
    console.warn("auto habit-log sync failed (will retry):", err);
    return 0;
  }
};