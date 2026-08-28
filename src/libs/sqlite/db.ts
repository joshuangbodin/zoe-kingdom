import * as SQLite from "expo-sqlite";

export const sqlite = SQLite.openDatabaseSync("zoe-kingdom.db");

/**
 * Schema versioning via SQLite 'PRAGMA user_version'.
 *
 * v1 -> v2: bible_verses.id was declared INTEGER PRIMARY KEY AUTOINCREMENT but
 * the seeder stores human-readable string ids ("0-0-0"). Inserting a string into
 * an INTEGER column throws SQLite error code 20 (datatype mismatch). v2 rebuilds
 * the table with a TEXT primary key so string ids work correctly.
 */
const SCHEMA_VERSION = 2;

const CREATE_TABLES = `
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
    id TEXT PRIMARY KEY NOT NULL,
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

  CREATE TABLE IF NOT EXISTS challenge_logs (
    id TEXT PRIMARY KEY NOT NULL,
    challengeId TEXT NOT NULL,
    period TEXT NOT NULL,
    xpEarned INTEGER DEFAULT 0,
    earnedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_challenge_logs
  ON challenge_logs(challengeId, period);
`;

export const initDB = async () => {
  try {
    const versionRow = (await sqlite.getFirstAsync(
      "PRAGMA user_version;",
    )) as { user_version?: number } | null;

    const currentVersion = Number(versionRow?.user_version ?? 0);

    // Migration: rebuild bible_verses when the previous schema had an INTEGER id.
    if (currentVersion < 2) {
      await sqlite.execAsync("DROP TABLE IF EXISTS bible_verses;");
    }

    await sqlite.execAsync(CREATE_TABLES);

    await sqlite.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  } catch (err) {
    console.error("DB init error:", err);
  }
};

