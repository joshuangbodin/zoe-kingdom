import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "./index";

/**
 * Firestore helpers for syncing the user's local (SQLite) progress —
 * habits, habit logs, and the XP / level / consistency map — to the cloud.
 *
 * Data is stored under `users/{uid}/`:
 *   habits/{habitId}   → one doc per habit
 *   habitLogs/{logId}  → one doc per completion log
 *   meta/progress      → aggregate { totalXP, level, spiritStage, contributions }
 */

export const userHabitsColl = (uid: string) =>
  collection(db, "users", uid, "habits");

export const userLogsColl = (uid: string) =>
  collection(db, "users", uid, "habitLogs");

export const userProgressDoc = (uid: string) =>
  doc(db, "users", uid, "meta", "progress");

export type ContributionsMap = Record<string, number>; // YYYY-MM-DD -> completions

export type ProgressData = {
  totalXP: number;
  level: number;
  spiritStage: string;
  contributions: ContributionsMap;
  lastSyncedAt?: any;
};

/* ------------------------------ READ ------------------------------ */

export const downloadHabits = async (uid: string): Promise<any[]> => {
  const snap = await getDocs(query(userHabitsColl(uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const downloadLogs = async (uid: string): Promise<any[]> => {
  const snap = await getDocs(query(userLogsColl(uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const downloadProgress = async (
  uid: string,
): Promise<ProgressData | null> => {
  const snap = await getDoc(userProgressDoc(uid));
  if (!snap.exists()) return null;
  const data = snap.data() as ProgressData;
  return {
    totalXP: data.totalXP ?? 0,
    level: data.level ?? 1,
    spiritStage: data.spiritStage ?? "",
    contributions: data.contributions ?? {},
    lastSyncedAt: data.lastSyncedAt,
  };
};

/* ------------------------------ WRITE ------------------------------ */

/**
 * Upsert many docs under a subcollection in Firestore batches (batch limit is
 * 500 writes, so we chunk to stay well under it).
 */
async function batchUpsert(
  buildRefs: () => { ref: any; data: any }[],
  chunk = 400,
): Promise<void> {
  const pairs = buildRefs();
  for (let i = 0; i < pairs.length; i += chunk) {
    const batch = writeBatch(db);
    for (const p of pairs.slice(i, i + chunk)) {
      batch.set(p.ref, p.data, { merge: true });
    }
    await batch.commit();
  }
}

export const uploadHabits = async (
  uid: string,
  habits: any[],
): Promise<void> => {
  await batchUpsert(() =>
    habits.map((h) => ({
      ref: doc(userHabitsColl(uid), h.id as string),
      data: {
        title: h.title,
        category: h.category ?? "discipline",
        frequency: h.frequency ?? "morning",
        slot: h.slot ?? null,
        icon: h.icon ?? "✨",
        color: h.color ?? "#FFD166",
        xpReward: h.xpReward ?? 10,
        duration: h.duration ?? 10,
        archived: h.archived ?? 0,
        createdAt: h.createdAt ?? null,
        updatedAt: serverTimestamp(),
      },
    })),
  );
};

export const uploadLogs = async (uid: string, logs: any[]): Promise<void> => {
  await batchUpsert(() =>
    logs.map((l) => ({
      ref: doc(userLogsColl(uid), l.id as string),
      data: {
        habitId: l.habitId,
        completedAt: l.completedAt,
        xpEarned: l.xpEarned ?? 10,
        slot: l.slot ?? null,
      },
    })),
  );
};

export const uploadProgress = async (
  uid: string,
  data: ProgressData,
): Promise<void> => {
  await setDoc(
    userProgressDoc(uid),
    {
      totalXP: data.totalXP,
      level: data.level,
      spiritStage: data.spiritStage,
      contributions: data.contributions,
      lastSyncedAt: serverTimestamp(),
    },
    { merge: true },
  );
};