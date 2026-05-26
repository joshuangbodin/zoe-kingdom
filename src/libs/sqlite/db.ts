import * as SQLite from "expo-sqlite";

export const sqlite = SQLite.openDatabaseSync("zoe-kingdom.db");

export const initDB = async () => {
  try {
    await sqlite.execAsync(`
      CREATE TABLE IF NOT EXISTS spirit_state (
        id INTEGER PRIMARY KEY NOT NULL,
        totalXP INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        spiritStage TEXT DEFAULT 'seed'
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'discipline',
        frequency TEXT DEFAULT 'morning',
        slot TEXT,
        icon TEXT DEFAULT '✨',
        color TEXT DEFAULT '#FFD166',
        xpReward INTEGER DEFAULT 10,
        duration INTEGER DEFAULT 10,
        archived INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY NOT NULL,
        habitId TEXT NOT NULL,
        completedAt TEXT NOT NULL,
        xpEarned INTEGER DEFAULT 10,
        synced INTEGER DEFAULT 0,
        slot TEXT,
        FOREIGN KEY (habitId) REFERENCES habits(id)
      );

      CREATE TABLE IF NOT EXISTS bible_verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT NOT NULL,
        bookIndex INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bible_lookup
      ON bible_verses(bookIndex, chapter);

      CREATE INDEX IF NOT EXISTS idx_bible_book
      ON bible_verses(book);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_verse
ON bible_verses(bookIndex, chapter, verse);
    `);
  } catch (err) {
    console.error("DB init error:", err);
  }
};
