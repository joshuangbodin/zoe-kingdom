import { sqlite } from "./db";
import { addXP } from "./spirit";

export type Habit = {
  id: string;
  title: string;
  category: string;

  frequency:
    | "morning"
    | "evening"
    | "twice_daily"
    | "weekly"
    | "throughout_day";

  slot: "morning" | "evening" | null;

  icon: string;
  color: string;

  xpReward: number;
  duration: number;

  archived: number;
  createdAt: string;
};

const getToday = () => new Date().toISOString().split("T")[0];

// CREATE HABIT
export const createHabit = async ({
  title,
  category = "discipline",
  frequency = "morning",
  icon = "✨",
 
  color = "#FFD166",
  xpReward = 10,
  duration = 10,
}: {
  title: string;
  category?: string;

  frequency?:
    | "morning"
    | "evening"
    | "twice_daily"
    | "weekly"
    | "throughout_day";

  icon?: string;
  
  color?: string;
  xpReward?: number;
  duration?: number;
}) => {
  const id = `hb-${Date.now()}`;

  await sqlite.runAsync(
    `
  INSERT INTO habits (
    id,
    title,
    category,
    frequency,
    icon,
    color,
    xpReward,
    duration,
    archived,
    createdAt
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      title,
      category,
      frequency,
      icon,
      color,
      xpReward,
      duration,
      0,
      new Date().toISOString(),
    ],
  );

  return id;
};

// GET ALL ACTIVE HABITS
export const getHabits = async () => {
  const result = await sqlite.getAllAsync<Habit>(
    `
      SELECT *
      FROM habits

      WHERE archived = 0

      ORDER BY createdAt DESC
      `,
  );

  return result;
};

// GET one habit
export const getHabitById = async (id:string) => {
  const result = await sqlite.getAllAsync<Habit>(
    `
      SELECT *
      FROM habits

      WHERE archived = 0 AND id =?

      ORDER BY createdAt DESC
      `, [id]
  );

  return result[0];
};

// CHECK IF COMPLETED TODAY
export const isHabitCompleted = async (habit: Habit) => {
  const now = new Date();
  const hour = now.getHours();

  let start = new Date();
  let end = new Date();

  switch (habit.frequency) {
    case "morning":
      start.setHours(4, 0, 0);
      end.setHours(11, 59, 59);
      break;

    case "evening":
      start.setHours(17, 0, 0);
      end.setHours(23, 59, 59);
      break;

    case "twice_daily":
      start.setHours(0, 0, 0);
      end.setHours(23, 59, 59);
      break;

    case "weekly":
      start.setDate(start.getDate() - start.getDay()); // week start
      end = new Date();
      break;

    case "throughout_day":
      start.setHours(0, 0, 0);
      end.setHours(23, 59, 59);
      break;
  }

  const result = await sqlite.getFirstAsync(
    `
    SELECT id
    FROM habit_logs
    WHERE habitId = ?
    AND completedAt BETWEEN ? AND ?
    LIMIT 1
    `,
    [habit.id, start.toISOString(), end.toISOString()],
  );

  return !!result;
};

// COMPLETE HABIT
export const completeHabit = async (habit: any) => {
  const now = new Date();
  const hour = now.getHours();

  let slot: string | null = null;

  if (habit.frequency === "twice_daily") {
    slot = hour < 12 ? "morning" : "evening";
  }

  const already = await sqlite.getFirstAsync(
    `
    SELECT id FROM habit_logs
    WHERE habitId = ?
    AND DATE(completedAt) = DATE(?)
    AND (
  (slot IS NULL AND ? IS NULL)
  OR slot = ?
)
    `,
    [habit.id, new Date().toISOString(), slot, slot],
  );

  if (already) {
    return { success: false, reason: "already_completed" };
  }

  await sqlite.runAsync(
    `
    INSERT INTO habit_logs
    (id, habitId, completedAt, xpEarned, synced, slot)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      `hblog-${Date.now()}`,
      habit.id,
      new Date().toISOString(),
      habit.xpReward,
      0,
      slot,
    ],
  );

  await addXP(habit.xpReward);

  return { success: true };
};

// ARCHIVE HABIT
export const archiveHabit = async (habitId: string) => {
  await sqlite.runAsync(
    `
      UPDATE habits

      SET archived = 1

      WHERE id = ?
      `,
    [habitId],
  );
};

// GET TODAY'S COMPLETED COUNT
export const getTodayCompletedCount = async () => {
  const today = getToday();

  const result: any = await sqlite.getFirstAsync(
    `
        SELECT COUNT(*) as total

        FROM habit_logs

        WHERE DATE(completedAt) = ?
        `,
    [today],
  );

  return result?.total || 0;
};
