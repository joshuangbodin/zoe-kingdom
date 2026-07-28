import { sqlite } from "./db";

export const getDailyStreak = async () => {
  /**
   * Get all unique completed days
   */
  const logs: any[] = await sqlite.getAllAsync(`
    SELECT DISTINCT DATE(completedAt) as day
    FROM habit_logs
    ORDER BY day DESC
  `);

  if (!logs.length) {
    return 0;
  }

  /**
   * Convert to array of strings
   */
  const completedDays = logs.map(
    (item) => item.day
  );

  let streak = 0;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Check if today is completed
  const todayCompleted = completedDays.includes(todayStr);

  // If today is NOT completed, start checking from yesterday
  // This way the streak doesn't break just because they haven't done it yet today
  const startOffset = todayCompleted ? 0 : 1;

  for (let i = startOffset; i < 365; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const formatted = date
      .toISOString()
      .split("T")[0];

    if (completedDays.includes(formatted)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};