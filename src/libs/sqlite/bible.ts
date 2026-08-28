import { Asset } from "expo-asset";
import { ungzip } from "pako";

import { sqlite } from "./db";

/* ---------------------------- TYPES ---------------------------- */

export type BibleVerse = {
  id: string;
  book: string;
  bookIndex: number;
  chapter: number;
  verse: number;
  text: string;
};

/* ---------------------------- FLATTEN ---------------------------- */

export const flattenBible = (bible: any[]): BibleVerse[] => {
  const rows: BibleVerse[] = [];

  bible.forEach((book, bookIndex) => {
    const chapters = book?.chapters ?? [];

    chapters.forEach((chapter: string[], chapterIndex: number) => {
      (chapter ?? []).forEach((verse: string, verseIndex: number) => {
        if (!verse) return;

        rows.push({
          id: `${bookIndex}-${chapterIndex}-${verseIndex}`, // IMPORTANT FIX
          book: book.name,
          bookIndex,
          chapter: chapterIndex + 1,
          verse: verseIndex + 1,
          text: verse,
        });
      });
    });
  });

  return rows;
};

  /* ---------------------------- BUNDLED DATA ---------------------------- */

  /**
   * Load the full KJV Bible from a compressed asset bundled inside the app.
   *
   * We used to fetch `en_kjv.json` from a third-party GitHub URL at runtime, but
   * that made the reader depend on the network + an external API. Instead the
   * whole Bible is shipped with the app as a ~1.35 MB gzipped JSON asset
   * (`assets/bible/kjv.json.gz`) and inflated/parsed locally on the first
   * open, then cached in SQLite for instant, indexed lookups.
   */
  export const loadBundledBible = async (): Promise<any[]> => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = Asset.fromModule(require("@/assets/bible/kjv.json.gz"));
    await asset.downloadAsync();

    const source = asset.localUri ?? asset.uri;
    const res = await fetch(source);
    const buffer = await res.arrayBuffer();

    const json = ungzip(new Uint8Array(buffer), { to: "string" });
    return JSON.parse(json) as any[];
  };

  /* ---------------------------- SEED ---------------------------- */

  export const seedBible = async () => {
    const bible = await loadBundledBible();

    const rows = flattenBible(bible);

    await sqlite.execAsync("BEGIN TRANSACTION;");

    try {
      const stmt = await sqlite.prepareAsync(`
        INSERT OR IGNORE INTO bible_verses
        (id, book, bookIndex, chapter, verse, text)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const r of rows) {
        await stmt.executeAsync([
          r.id,
          r.book,
          r.bookIndex,
          r.chapter,
          r.verse,
          r.text,
        ]);
      }

      await stmt.finalizeAsync();
      await sqlite.execAsync("COMMIT;");
    } catch (e) {
      await sqlite.execAsync("ROLLBACK;");
      throw e;
    }
  };

  /* ---------------------------- DB CHECK ---------------------------- */

  export const checkBibleExists = async () => {
    const res = await sqlite.getFirstAsync(
      `SELECT COUNT(*) as count FROM bible_verses`,
    );

    return (res as any)?.count > 0;
  };

/* ---------------------------- INSERT (FAST + SAFE) ---------------------------- */

export const insertBible = async (rows: BibleVerse[]) => {
  if (!rows.length) return;

  try {
    await sqlite.execAsync("BEGIN TRANSACTION;");

    const stmt = await sqlite.prepareAsync(`
      INSERT OR IGNORE INTO bible_verses 
      (id, book, bookIndex, chapter, verse, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const r of rows) {
      // id mirrors flattenBible's convention: bookIndex-chapterIndex-verseIndex
      const id = `${r.bookIndex}-${r.chapter - 1}-${r.verse - 1}`;

      await stmt.executeAsync([
        id,
        r.book,
        r.bookIndex,
        r.chapter,
        r.verse,
        r.text,
      ]);
    }

    await stmt.finalizeAsync();
    await sqlite.execAsync("COMMIT;");
  } catch (err) {
    await sqlite.execAsync("ROLLBACK;");
    throw err;
  }
};

/* ---------------------------- GET CHAPTER (FAST QUERY) ---------------------------- */

export const getChapter = async (bookIndex: number, chapter: number) => {
  const result = await sqlite.getAllAsync<BibleVerse>(
    `
    SELECT id, book, bookIndex, chapter, verse, text
    FROM bible_verses
    WHERE bookIndex = ? AND chapter = ?
    ORDER BY verse ASC
    `,
    [bookIndex, chapter]
  );

  return result ?? [];
};

/* ---------------------------- SINGLE-FLIGHT SEED ---------------------------- */

let seedingPromise: Promise<boolean> | null = null;

/**
 * Seed the Bible exactly once, deduplicating concurrent callers (the Bible tab
 * and the Bible modal both fire on first open). Subsequent calls resolve
 * immediately once the data is available, so reads stay fast.
 */
export const ensureBibleSeeded = (): Promise<boolean> => {
  if (!seedingPromise) {
    seedingPromise = (async () => {
      if (await checkBibleExists()) return true;
      await seedBible();
      return await checkBibleExists();
    })().catch((err) => {
      seedingPromise = null; // allow a retry next time
      throw err;
    });
  }
  return seedingPromise;
};