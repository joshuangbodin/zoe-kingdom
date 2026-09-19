import { sqlite } from "./db";
import { addXP } from "./spirit";
import { rescheduleAllHabitReminders } from "@/libs/reminders/scheduleHabitNotifications";

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
  /** 0 = off, 1 = remind me daily at `remindAt`. */
  remindEnabled: number;
  /** "HH:MM" in 24h, e.g. "08:30". Null when no reminder is set. */
  remindAt: string | null;
  createdAt: string;
};

const getToday = () => new Date().toISOString().split("T")[0];

/**
 * The current LOCAL calendar day expressed as UTC ISO instants, from 00:00:00.000
 * to 23:59:59.999. Using the local-day span (instead of narrow time-of-day
 * windows or a `DATE()` cast) makes completion detection consistent no matter
 * when during the day a habit is actually completed.
 */
const dayRange = (): { start: string; end: string } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start: start.toISOString(), end: end.toISOString() };
};

// CREATE HABIT
export const createHabit = async ({
  title,
  category = "discipline",
  frequency = "morning",
  icon = "✨",
 
  color = "#FFD166",
  xpReward = 10,
  duration = 10,
  remindEnabled = 0,
  remindAt = null,
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
  remindEnabled?: number;
  remindAt?: string | null;
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
    remindEnabled,
    remindAt,
    archived,
    createdAt
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      remindEnabled,
      remindAt,
      0,
      new Date().toISOString(),
    ],
  );

  return id;
};

/**
 * Enable/disable (and set the time for) a habit's daily reminder.
 * Passing an empty `time` turns the reminder off.
 */
export const setHabitReminder = async (
  habitId: string,
  enabled: boolean,
  time?: string | null,
) => {
  const remindAt =
    enabled && time && /^[0-2][0-9]:[0-5][0-9]$/.test(time) ? time : null;

  await sqlite.runAsync(
    `UPDATE habits SET remindEnabled = ?, remindAt = ? WHERE id = ?`,
    [remindAt ? 1 : 0, remindAt, habitId],
  );

    // Keep OS-level daily notification schedules in sync with the reminder state.
    try {
      await rescheduleAllHabitReminders(await getHabits());
    } catch (err) {
      console.warn("reschedule after reminder change failed:", err);
    }
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

  // MORNING — counts a habit as done any time today (not just during morning
  // hours), so a completion always marks the day complete regardless of when
  // the user actually gets to it in the afternoon or evening.
  if (habit.frequency === "morning") {
    const { start, end } = dayRange();

    const done = await checkLog(
      start,
      end,
    );

    return {
      status: done,
      message: done
        ? "Morning habit completed"
        : `${habit.title} remains`,
    };
  }

  // EVENING — same local-day treatment as morning.
  if (habit.frequency === "evening") {
    const { start, end } = dayRange();

    const done = await checkLog(
      start,
      end,
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
  const { start, end } = dayRange();

  const done = await checkLog(
    start,
    end,
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

  // Duplicate detection mirrors `getHabitStatus`: a log counts as completed for
  // the current LOCAL day when it falls anywhere within today's span, so the
  // gate we enforce here exactly matches what the status check reports.
  const { start, end } = dayRange();

  const already = await sqlite.getFirstAsync(
    `
    SELECT id FROM habit_logs
    WHERE habitId = ?
    AND completedAt BETWEEN ? AND ?
    AND (
  (slot IS NULL AND ? IS NULL)
  OR slot = ?
)
    `,
    [habit.id, start, end, slot, slot],
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
