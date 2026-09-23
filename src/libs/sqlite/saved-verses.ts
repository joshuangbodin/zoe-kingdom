/**
 * saved-verses.ts
 *
 * Lightweight, offline-first persistence for verses a reader saves / highlights
 * from the Bible. Entries live in the local `saved_verses` SQLite table using
 * the same `"bookIndex-chapterIndex-verseIndex"` id as `bible_verses.id`.
 *
 * All functions are defensive (they never throw on transient failures) and are
 * safe to call from the reader UI on every toggle.
 */
import { initDB, sqlite } from "./db";

export type SavedVerseRow = {
  id: string;
  book: string;
  bookIndex: number;
  chapter: number;
  verse: number;
  note?: string | null;
  color?: string | null;
  savedAt: string;
};

export type SavedVerseInput = {
  id: string;
  book: string;
  bookIndex: number;
  chapter: number;
  verse: number;
  note?: string | null;
  color?: string | null;
};

/** Resolve the full set of currently-saved verse ids. */
export const getSavedIds = async (): Promise<Set<string>> => {
  try {
    await initDB();
    const res = (await sqlite.getAllAsync<{ id: string }>(
      "SELECT id FROM saved_verses",
    )) ?? [];
    return new Set(res.map((r) => r.id));
  } catch (err) {
    console.error("getSavedIds error:", err);
    return new Set();
  }
};

/** Check a single verse id in isolation (used by the save toggle state). */
export const isVerseSaved = async (id: string): Promise<boolean> => {
  try {
    await initDB();
    const res = await sqlite.getFirstAsync(
      "SELECT 1 AS s FROM saved_verses WHERE id = ?",
      [id],
    );
    return !!res;
  } catch (err) {
    console.error("isVerseSaved error:", err);
    return false;
  }
};

/** Fetch a single saved verse (with its note + color tag), or null. */
export const getSavedVerse = async (
  id: string,
): Promise<SavedVerseRow | null> => {
  try {
    await initDB();
    const res = await sqlite.getFirstAsync<SavedVerseRow>(
      `SELECT id, book, bookIndex, chapter, verse, note, color, savedAt
       FROM saved_verses
       WHERE id = ?`,
      [id],
    );
    return res ?? null;
  } catch (err) {
    console.error("getSavedVerse error:", err);
    return null;
  }
};

/**
 * Insert (or fully update, if already present) each of the given verses along
 * with their optional note and color tag. Uses an upsert so re-saving a verse
 * with changed note/color overwrites the previous values.
 */
export const saveVerses = async (rows: SavedVerseInput[]): Promise<void> => {
  if (!rows.length) return;
  try {
    await initDB();
    await sqlite.execAsync("BEGIN TRANSACTION;");
    const stmt = await sqlite.prepareAsync(`
      INSERT INTO saved_verses (id, book, bookIndex, chapter, verse, note, color, savedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        note = excluded.note,
        color = excluded.color,
        savedAt = excluded.savedAt
    `);
    const now = new Date().toISOString();
    for (const r of rows) {
      await stmt.executeAsync([
        r.id,
        r.book,
        r.bookIndex,
        r.chapter,
        r.verse,
        r.note ?? null,
        r.color ?? null,
        now,
      ]);
    }
    await stmt.finalizeAsync();
    await sqlite.execAsync("COMMIT;");
  } catch (err) {
    try {
      await sqlite.execAsync("ROLLBACK;");
    } catch {
      /* ignore */
    }
    console.error("saveVerses error:", err);
  }
};

/** Remove the given verse ids from saved. */
export const unsaveVerses = async (ids: string[]): Promise<void> => {
  if (!ids.length) return;
  try {
    await initDB();
    const placeholders = ids.map(() => "?").join(",");
    const stmt = await sqlite.prepareAsync(
      `DELETE FROM saved_verses WHERE id IN (${placeholders})`,
    );
    await stmt.executeAsync(ids);
    await stmt.finalizeAsync();
  } catch (err) {
    console.error("unsaveVerses error:", err);
  }
};