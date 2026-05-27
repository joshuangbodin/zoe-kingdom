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
// CHECK HABIT STATUS
export const getHabitStatus = async (habit: Habit) => {
  const now = new Date();
  const hour = now.getHours();

  const today = new Date().toISOString().split("T")[0];

  // helper
  const checkLog = async (
    start: string,
    end: string,
    slot?: string | null,
  ) => {
    let query = `
      SELECT id
      FROM habit_logs
      WHERE habitId = ?
      AND completedAt BETWEEN ? AND ?
    `;

    const params: any[] = [habit.id, start, end];

    if (slot !== undefined) {
      query += ` AND slot = ?`;
      params.push(slot);
    }

    query += ` LIMIT 1`;

    const result = await sqlite.getFirstAsync(query, params);

    return !!result;
  };

  // MORNING
  if (habit.frequency === "morning") {
    const start = new Date();
    start.setHours(4, 0, 0, 0);

    const end = new Date();
    end.setHours(11, 59, 59, 999);

    const done = await checkLog(
      start.toISOString(),
      end.toISOString(),
    );

    return {
      status: done,
      message: done
        ? "Morning habit completed"
        : `${habit.title} remains`,
    };
  }

  // EVENING
  if (habit.frequency === "evening") {
    const start = new Date();
    start.setHours(17, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const done = await checkLog(
      start.toISOString(),
      end.toISOString(),
    );

    return {
      status: done,
      message: done
        ? "Evening habit completed"
        : `${habit.title} remains`,
    };
  }

  // TWICE DAILY
  if (habit.frequency === "twice_daily") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const morningDone = await checkLog(
      start.toISOString(),
      end.toISOString(),
      "morning",
    );

    const eveningDone = await checkLog(
      start.toISOString(),
      end.toISOString(),
      "evening",
    );

    const fullyCompleted = morningDone && eveningDone;

    let message = "";

    if (fullyCompleted) {
      message = "Fully completed";
    } else if (!morningDone && !eveningDone) {
      message = "Morning and evening remain";
    } else if (!morningDone) {
      message = "Morning remains";
    } else {
      message = "Evening remains";
    }

    return {
      status: fullyCompleted,
      message,
      progress: {
        morning: morningDone,
        evening: eveningDone,
      },
    };
  }

  // WEEKLY
  if (habit.frequency === "weekly") {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date();

    const done = await checkLog(
      start.toISOString(),
      end.toISOString(),
    );

    return {
      status: done,
      message: done
        ? "Weekly habit completed"
        : "This week remains",
    };
  }

  // THROUGHOUT DAY
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const done = await checkLog(
    start.toISOString(),
    end.toISOString(),
  );

  return {
    status: done,
    message: done
      ? "Completed for today"
      : `${habit.title} remains`,
  };
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
