import { sqlite } from "./db";
import { addXP } from "./spirit";

export type Habit = {
  id: string;
  title: string;
  streak: number;
  xpReward: number;
  createdAt: string;
};
const getToday = () => new Date().toISOString().split("T")[0];
// CREATE HABIT
export const createHabit = async (title: string, xpReward: number = 10) => {
  const id = `hb-${Date.now()}`;

  await sqlite.runAsync(
    `
      INSERT INTO habits
      (id, title, streak, xpReward, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `,
    [id, title, 0, xpReward, new Date().toISOString()],
  );

  return id;
};

// GET ALL HABITS
export const getHabits = async () => {
  const result = await sqlite.getAllAsync<Habit>(
    `
      SELECT * FROM habits
      ORDER BY createdAt DESC
    `,
  );

  return result;
};

// COMPLETE HABIT
export const completeHabit = async (habitId: string) => {
  const today = getToday();

  // 1. CHECK if already completed today
  const existing = await sqlite.getFirstAsync(
    `
      SELECT * FROM habit_logs
      WHERE habitId = ?
      AND DATE(completedAt) = ?
      LIMIT 1
    `,
    [habitId, today],
  );

  if (existing) {
    console.log("Habit already completed today");
    return false; // stop double XP / streak abuse
  }

  // 2. get habit
  const habit: any = await sqlite.getFirstAsync(
    `
      SELECT * FROM habits
      WHERE id = ?
    `,
    [habitId],
  );

  if (!habit) return false;

  // 3. insert log
  await sqlite.runAsync(
    `
      INSERT INTO habit_logs
      (id, habitId, completedAt, synced)
      VALUES (?, ?, ?, ?)
    `,
    [
      `hblog-${Date.now()}`,
      habitId,
      new Date().toISOString(),
      0,
    ],
  );

  // 4. update streak (still simple for now)
  const newStreak = habit.streak + 1;

  await sqlite.runAsync(
    `
      UPDATE habits
      SET streak = ?
      WHERE id = ?
    `,
    [newStreak, habitId],
  );

  // 5. XP reward
  await addXP(habit.xpReward);

  return true;
};
