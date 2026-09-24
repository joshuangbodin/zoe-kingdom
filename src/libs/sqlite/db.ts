import * as SQLite from "expo-sqlite";

export const sqlite = SQLite.openDatabaseSync("zoe-kingdom.db");

/**
 * Schema versioning via SQLite 'PRAGMA user_version'.
 *
 * v1 -> v2: bible_verses.id was declared INTEGER PRIMARY KEY AUTOINCREMENT but
 * the seeder stores human-readable string ids ("0-0-0"). Inserting a string into
 * an INTEGER column throws SQLite error code 20 (datatype mismatch). v2 rebuilds
 * the table with a TEXT primary key so string ids work correctly.
 *
 * v2 -> v3: adds per-habit reminders. `remindEnabled` toggles the reminder
 * (a self-contained, offline background poller in `libs/reminders`), and
 * `remindAt` stores the daily time as "HH:MM" (24h) when the user wants to be
 * pinged.
 *
 * v3 -> v4: adds the `saved_verses` table so readers can save/highlight verses.
 * It is added via `CREATE TABLE IF NOT EXISTS`, so an existing v3 database picks
 * it up on the next launch without needing a destructive migration.
 *
 * v4 -> v5: adds `note` and `color` (color tag) columns to `saved_verses` so a
 * saved verse can carry a personal note and a highlight color. Added via a
 * non-destructive `ALTER TABLE ... ADD COLUMN` migration below.
 */
const SCHEMA_VERSION = 5;

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
    remindEnabled INTEGER DEFAULT 0,
    remindAt TEXT,
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

  CREATE TABLE IF NOT EXISTS saved_verses (
    id TEXT PRIMARY KEY NOT NULL,
    book TEXT NOT NULL,
    bookIndex INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    note TEXT,
    color TEXT,
    savedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_saved_lookup
  ON saved_verses(bookIndex, chapter);

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

let initDBPromise: Promise<void> | null = null;

/**
 * Initializes (and migrates) the SQLite schema exactly once. Idempotent: every
 * caller awaits the same in-flight promise, so eager queries never race table
 * creation (avoids a cold-start missing table error).
 */
export const initDB = (): Promise<void> => {
  if (initDBPromise) return initDBPromise;

  initDBPromise = (async () => {
    try {
      const versionRow = (await sqlite.getFirstAsync(
        "PRAGMA user_version;",
      )) as { user_version?: number } | null;

      const currentVersion = Number(versionRow?.user_version ?? 0);

      // Fresh or old DBs only: rebuild bible_verses when its id was INTEGER.
      if (currentVersion < 2) {
        await sqlite.execAsync("DROP TABLE IF EXISTS bible_verses;");
      }

      // Build the base schema FIRST so a fresh database already has every table
      // (and the v3 columns) before migrations run. This is what prevents a
      // missing-tables error when the database is brand new.
      await sqlite.execAsync(CREATE_TABLES);

      // Migration: add per-habit reminder columns. Only affects an existing
      // v2 database that predates these columns; fresh DBs already have them.
      if (currentVersion < 3) {
        const cols = (await sqlite.getAllAsync("PRAGMA table_info(habits);")) as {
          name: string;
        }[];
        const has = (name: string) => cols.some((c) => c.name === name);
        if (!has("remindEnabled")) {
          await sqlite.execAsync(
            "ALTER TABLE habits ADD COLUMN remindEnabled INTEGER DEFAULT 0;",
          );
        }
        if (!has("remindAt")) {
          await sqlite.execAsync("ALTER TABLE habits ADD COLUMN remindAt TEXT;");
        }
      }

      // Reconcile saved_verses columns UNCONDITIONALLY (idempotent). `CREATE TABLE
      // IF NOT EXISTS` never adds columns to an already-existing table, and a
      // device whose `user_version` was bumped to 5 by a previous run will skip
      // the `version < 5` gate below. Checking the live column list and ALTER-ing
      // when missing self-heals a DB stuck at any version, so note/color always
      // exist before any saved-verses query runs.
      try {
        const savedCols = (await sqlite.getAllAsync(
          "PRAGMA table_info(saved_verses);",
        )) as { name: string }[];
        const savedHas = (name: string) =>
          savedCols.some((c) => c.name === name);
        if (!savedHas("note")) {
          await sqlite.execAsync("ALTER TABLE saved_verses ADD COLUMN note TEXT;");
        }
        if (!savedHas("color")) {
          await sqlite.execAsync("ALTER TABLE saved_verses ADD COLUMN color TEXT;");
        }
      } catch (err) {
        console.error("saved_verses reconcile error:", err);
      }

      await sqlite.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    } catch (err) {
      console.error("DB init error:", err);
    }
  })();

  return initDBPromise;
};

