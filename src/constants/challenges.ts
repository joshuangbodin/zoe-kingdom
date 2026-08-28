/**
 * Weekly XP challenges.
 *
 * Each challenge is driven by a metric that is computed locally from SQLite
 * (habit_logs + streak), so it works offline and in guest mode — exactly like
 * the habit system it builds on. Completing a challenge and claiming it awards
 * bonus XP via `addXP()` and records the claim in the `challenge_logs` table so
 * it survives a manual "Sync now" (the sync total is computed from habit_logs
 * + challenge_logs).
 */

export type ChallengeMetric = "completions" | "active_days" | "streak";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  metric: ChallengeMetric;
  target: number;
  reward: number;
  /** name of a lucide-react-native icon to render for the challenge */
  icon: string;
  color: string;
};

export const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: "devotion",
    title: "Devoted Heart",
    description: "Complete 3 habits this week",
    metric: "completions",
    target: 3,
    reward: 15,
    icon: "Flame",
    color: "#f59e0b",
  },
  {
    id: "faithful",
    title: "Faithful Seven",
    description: "Complete 7 habits this week",
    metric: "completions",
    target: 7,
    reward: 30,
    icon: "Check",
    color: "#10b981",
  },
  {
    id: "warrior",
    title: "5-Day Warrior",
    description: "Stay active on 5 different days this week",
    metric: "active_days",
    target: 5,
    reward: 25,
    icon: "Calendar",
    color: "#3b82f6",
  },
  {
    id: "streak",
    title: "Keeper of the Flame",
    description: "Reach a 3-day streak",
    metric: "streak",
    target: 3,
    reward: 40,
    icon: "Zap",
    color: "#ec4899",
  },
];

/* ---------------------------- PERIOD HELPERS ---------------------------- */

/** Sunday 00:00 of the current (local) week. */
export const getWeekStart = (d: Date = new Date()) => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

/** ISO-8601 style week key, e.g. "2026-W35" — resets challenges once a week. */
export const getChallengePeriod = (d: Date = new Date()) => {
  const start = getWeekStart(d);

  const date = new Date(
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()),
  );
  const dayNum = date.getUTCDay() || 7; // Sunday = 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    (date.getTime() - yearStart.getTime()) / 86400000 / 7 + 1,
  );

  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

/** [start, end) date range covering the current week, as ISO strings. */
export const getWeekRange = (d: Date = new Date()) => {
  const start = getWeekStart(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
};