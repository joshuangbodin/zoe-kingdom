import { sqlite } from "./db";
import { addXP } from "./spirit";

export type Habit = {
  id: string;
  title: string;
  streak: number;
  xpReward: number;
  createdAt: string;
};


// CREATE HABIT
export const createHabit = async (
  title: string,
  xpReward: number = 10
) => {
  const id = crypto.randomUUID();

  await sqlite.runAsync(
    `
      INSERT INTO habits
      (id, title, streak, xpReward, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      id,
      title,
      0,
      xpReward,
      new Date().toISOString(),
    ]
  );

  return id;
};


// GET ALL HABITS
export const getHabits = async () => {
  const result = await sqlite.getAllAsync<Habit>(
    `
      SELECT * FROM habits
      ORDER BY createdAt DESC
    `
  );

  return result;
};


// COMPLETE HABIT
export const completeHabit = async (
  habitId: string
) => {
  // get habit
  const habit: any = await sqlite.getFirstAsync(
    `
      SELECT * FROM habits
      WHERE id = ?
    `,
    [habitId]
  );

  if (!habit) return;

  // create completion log
  await sqlite.runAsync(
    `
      INSERT INTO habit_logs
      (id, habitId, completedAt, synced)
      VALUES (?, ?, ?, ?)
    `,
    [
      crypto.randomUUID(),
      habitId,
      new Date().toISOString(),
      0,
    ]
  );

  // update streak
  const newStreak = habit.streak + 1;

  await sqlite.runAsync(
    `
      UPDATE habits
      SET streak = ?
      WHERE id = ?
    `,
    [newStreak, habitId]
  );

  // add XP
  await addXP(habit.xpReward);

  return true;
};