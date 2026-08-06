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

  /* ---------------------------- SEED ---------------------------- */

  export const seedBible = async () => {
    const BIBLE_URL =
      "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json";

    const res = await fetch(BIBLE_URL);
    const bible = await res.json();

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