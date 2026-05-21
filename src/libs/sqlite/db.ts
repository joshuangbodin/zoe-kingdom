import * as SQLite from "expo-sqlite";

export const sqlite = SQLite.openDatabaseSync("zoe-kingdom.db");

export const initDB = async () => {
  try {
//     await sqlite.execAsync(`
//   DROP TABLE IF EXISTS habits;
//   DROP TABLE IF EXISTS habit_logs;
//   DROP TABLE IF EXISTS spirit_state;
// `);

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

      streak INTEGER DEFAULT 0,
      xpReward INTEGER DEFAULT 10,

      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,

      habitId TEXT NOT NULL,

      completedAt TEXT NOT NULL,

      synced INTEGER DEFAULT 0
    );

  `);
  } catch (err) {
    console.error(err);
  }
};
