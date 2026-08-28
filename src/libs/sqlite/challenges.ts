import {
  Challenge,
  WEEKLY_CHALLENGES,
  getChallengePeriod,
  getWeekRange,
} from "@/constants/challenges";
import { getDailyStreak } from "./streak";
import { sqlite } from "./db";
import { addXP } from "./spirit";

/* -------------------------------------------------------------------------- */
/*                                    READ                                    */
/* -------------------------------------------------------------------------- */

export const getChallengeLogs = async (): Promise<any[]> => {
  return await sqlite.getAllAsync("SELECT * FROM challenge_logs");
};

/** Total XP earned from claimed challenges (used by the manual sync). */
export const getChallengeXPRewarded = async (): Promise<number> => {
  const row: any = await sqlite.getFirstAsync(
    "SELECT COALESCE(SUM(xpEarned), 0) AS total FROM challenge_logs",
  );
  return Number(row?.total || 0);
};

export const hasClaimed = async (
  challengeId: string,
  period: string,
): Promise<boolean> => {
  const row = await sqlite.getFirstAsync(
    "SELECT id FROM challenge_logs WHERE challengeId = ? AND period = ? LIMIT 1",
    [challengeId, period],
  );
  return !!row;
};

const countWeekCompletions = async (): Promise<number> => {
  const { start, end } = getWeekRange();
  const row: any = await sqlite.getFirstAsync(
    "SELECT COUNT(*) AS c FROM habit_logs WHERE completedAt >= ? AND completedAt < ?",
    [start, end],
  );
  return Number(row?.c || 0);
};

const countWeekActiveDays = async (): Promise<number> => {
  const { start, end } = getWeekRange();
  const row: any = await sqlite.getFirstAsync(
    "SELECT COUNT(DISTINCT DATE(completedAt)) AS c FROM habit_logs WHERE completedAt >= ? AND completedAt < ?",
    [start, end],
  );
  return Number(row?.c || 0);
};

export type ChallengeProgress = Challenge & {
  progress: number;
  done: boolean;
  claimed: boolean;
};

export const getChallengesWithProgress = async (): Promise<
  ChallengeProgress[]
> => {
  const period = getChallengePeriod();

  const [completions, activeDays, streak, claimedList] = await Promise.all([
    countWeekCompletions(),
    countWeekActiveDays(),
    getDailyStreak(),
    getChallengeLogs(),
  ]);

  const claimedSet = new Set(
    claimedList.map((l) => `${l.challengeId}|${l.period}`),
  );

  return WEEKLY_CHALLENGES.map((c) => {
    const raw =
      c.metric === "completions"
        ? completions
        : c.metric === "active_days"
          ? activeDays
          : streak;

    const progress = Math.min(raw, c.target);

    return {
      ...c,
      progress,
      done: progress >= c.target,
      claimed: claimedSet.has(`${c.id}|${period}`),
    };
  });
};

/* -------------------------------------------------------------------------- */
/*                                   CLAIM                                    */
/* -------------------------------------------------------------------------- */

export const claimChallenge = async (
  challenge: Challenge,
  period: string = getChallengePeriod(),
): Promise<{ success: boolean; reason?: string }> => {
  const already = await hasClaimed(challenge.id, period);
  if (already) return { success: false, reason: "claimed" };

  const id = `chl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await sqlite.runAsync(
    `INSERT OR IGNORE INTO challenge_logs
      (id, challengeId, period, xpEarned, earnedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [id, challenge.id, period, challenge.reward, new Date().toISOString()],
  );

  await addXP(challenge.reward);

  return { success: true };
};