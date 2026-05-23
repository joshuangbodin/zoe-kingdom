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

  /**
   * Check backwards day by day
   */
  for (let i = 0; i < 365; i++) {
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