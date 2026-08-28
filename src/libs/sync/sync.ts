import { getYearContributions } from "@/libs/sqlite/contributions";
import { sqlite } from "@/libs/sqlite/db";
import { getSpiritState, initializeSpirit } from "@/libs/sqlite/spirit";

import {
  downloadHabits,
  downloadLogs,
  downloadProgress,
  uploadHabits,
  uploadLogs,
  uploadProgress,
} from "@/libs/firebase/progress";
import type { ContributionsMap } from "@/libs/firebase/progress";

/**
 * Manual, user-initiated sync between the local SQLite store and Firebase.
 *
 * "Consistency map" = the GitHub-style contribution graph derived from
 * `habit_logs`. "XP / level / status" = the spirit_state totals. All of these
 * are upload + merged with whatever exists in the cloud, and the aggregate
 * snapshot is written to `users/{uid}/meta/progress`.
 *
 * Unlike the offline post queue this is NOT automatic — it only runs when the
 * user explicitly taps "Sync now", as agreed in AGENTS.md.
 */

export type SyncResult = {
  habitsUploaded: number;
  logsUploaded: number;
  pulledHabits: number;
  pulledLogs: number;
  totalXP: number;
  level: number;
};

/** Mirrors the level formula used by `src/libs/sqlite/spirit.ts`. */
const levelFor = (totalXP: number) => Math.floor(Math.sqrt(totalXP / 10)) + 1;

export const syncLocalDataToFirebase = async (
  uid: string,
): Promise<SyncResult> => {
  // Make sure the one-row spirit_state exists before reading/writing it.
  await initializeSpirit();

  const habits: any[] = await sqlite.getAllAsync("SELECT * FROM habits");
  const logs: any[] = await sqlite.getAllAsync("SELECT * FROM habit_logs");
  const spirit: any = await getSpiritState();

  // ---- Upload local state to the cloud ----
  await uploadHabits(uid, habits);
  await uploadLogs(uid, logs);

  // ---- Pull remote data (e.g. created on another device) ----
  const remoteHabits = await downloadHabits(uid);
  const remoteLogs = await downloadLogs(uid);

  const localHabitIds = new Set(habits.map((h) => h.id));
  const localLogIds = new Set(logs.map((l) => l.id));

  let pulledHabits = 0;
  for (const h of remoteHabits) {
    if (localHabitIds.has(h.id)) continue;
    await sqlite.runAsync(
      `INSERT OR IGNORE INTO habits
        (id, title, category, frequency, slot, icon, color, xpReward, duration, archived, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        h.id,
        h.title,
        h.category ?? "discipline",
        h.frequency ?? "morning",
        h.slot ?? null,
        h.icon ?? "✨",
        h.color ?? "#FFD166",
        h.xpReward ?? 10,
        h.duration ?? 10,
        h.archived ?? 0,
        h.createdAt ?? new Date().toISOString(),
      ],
    );
    pulledHabits += 1;
  }

  let pulledLogs = 0;
  for (const l of remoteLogs) {
    if (localLogIds.has(l.id)) continue;
    await sqlite.runAsync(
      `INSERT OR IGNORE INTO habit_logs
        (id, habitId, completedAt, xpEarned, synced, slot)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [l.id, l.habitId, l.completedAt, l.xpEarned ?? 10, 0, l.slot ?? null],
    );
    pulledLogs += 1;
  }

  // ---- Recompute XP / level deterministically from the merged log set ----
  // Every completion stores its own xpEarned, so the sum equals the accrued XP.
  const mergedLogs: any[] = await sqlite.getAllAsync(
    "SELECT xpEarned FROM habit_logs",
  );
  const totalXP = mergedLogs.reduce(
    (sum, l) => sum + (Number(l.xpEarned) || 0),
    0,
  );
  const level = levelFor(totalXP);

  // Keep the existing spiritStage unless local has none and the cloud does.
  let spiritStage = spirit?.spiritStage ?? "";
  if (!spiritStage) {
    const remoteP = await downloadProgress(uid);
    if (remoteP?.spiritStage) spiritStage = remoteP.spiritStage;
  }

  await sqlite.runAsync(
    "UPDATE spirit_state SET totalXP = ?, level = ? WHERE id = ?",
    [totalXP, level, spirit?.id],
  );

  // ---- Consistency map (date -> completions) for the current year ----
  const year = new Date().getFullYear();
  const contributions: ContributionsMap = {};
  for (const day of await getYearContributions(year)) {
    if (day.count > 0) contributions[day.date] = day.count;
  }

  // ---- Push aggregate progress to the cloud ----
  await uploadProgress(uid, { totalXP, level, spiritStage, contributions });

  return {
    habitsUploaded: habits.length,
    logsUploaded: logs.length,
    pulledHabits,
    pulledLogs,
    totalXP,
    level,
  };
};