import { sqlite } from "@/libs/sqlite/db";
import { Habit } from "@/libs/sqlite/habits";

/**
 * Habits that currently have a daily reminder due and aren't already completed
 * for today. Self-contained and fully offline — the app polls this from the
 * global worker (works in guest mode, exactly like the rest of the habit
 * system).
 *
 * A habit is "due" when its `remindAt` (HH:MM, 24h) matches the current
 * wall-clock minute. Completed-by-slot is honoured for `twice_daily`
 * (morning/evening) so we never nag about something already done.
 */
export const getDueReminderHabits = async (
  now: Date = new Date(),
): Promise<Habit[]> => {
  // "HH:MM" of the current minute.
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const current = `${hh}:${mm}`;
  const today = now.toISOString().split("T")[0];
  const hour = now.getHours();

  const rows = await sqlite.getAllAsync<Habit>(
    `
    SELECT * FROM habits
    WHERE archived = 0
      AND remindEnabled = 1
      AND remindAt = ?
    `,
    [current],
  );

  const due: Habit[] = [];

  for (const habit of rows) {
    const done = await sqlite.getFirstAsync(
      `SELECT id FROM habit_logs
       WHERE habitId = ? AND DATE(completedAt) = ?
       AND (
         (? IS NULL AND slot IS NULL)
         OR slot = ?
       )
       LIMIT 1`,
      [habit.id, today, null, null],
    );

    if (done) continue;

    // For twice_daily, only remind about the half that's still pending.
    if (habit.frequency === "twice_daily") {
      const slot = hour < 12 ? "morning" : "evening";
      const slotDone = await sqlite.getFirstAsync(
        `SELECT id FROM habit_logs
         WHERE habitId = ? AND DATE(completedAt) = ? AND slot = ?
         LIMIT 1`,
        [habit.id, today, slot],
      );
      if (slotDone) continue;
    }

    due.push(habit);
  }

  return due;
};