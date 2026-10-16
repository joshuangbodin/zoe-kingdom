import {
  ENERGY_CONFIG,
  LEVELS,
  isLevelUnlocked,
  type StoryLevel,
} from "@/data/story";
import { starsFor } from "@/libs/puzzles/stars";
import { addXP } from "./spirit";
import { sqlite } from "./db";

/**
 * Story-game data layer ("Zoe's Journey").
 *
 * The game is gated by ENERGY, earned by completing real habits (see
 * `habits.ts` -> `addEnergy`). Playing a level spends energy and awards XP
 * through the same `addXP()` used by habits/challenges, so story rewards feed
 * the real level + global leaderboard.
 *
 * Everything lives in SQLite so the game works fully offline (the app is
 * offline-first). A single `story_energy` row (id = 1) holds the balance; each
 * solved level gets a `story_progress` row carrying its star rating, so the map
 * can show 1-3 stars per level and the player can replay for a better score.
 *
 * The energy economy is authored in `src/data/story/game.json` — one level
 * always costs 2 energy, and a habit grants enough to buy several levels.
 */

/** Energy can never exceed this cap, so the balance stays meaningful. */
export const MAX_ENERGY = ENERGY_CONFIG.maxEnergy;

/** Energy granted per habit completion. */
export const ENERGY_PER_HABIT = ENERGY_CONFIG.perHabit;

/** Refill added once per calendar day on first open (anti dead-end). */
export const DAILY_REFILL = ENERGY_CONFIG.dailyRefill;

/** Energy one level costs — the core of the whole economy. */
export const COST_PER_LEVEL = ENERGY_CONFIG.costPerLevel;

const ENERGY_ROW_ID = 1;

const getToday = () => new Date().toISOString().split("T")[0];

/* -------------------------------------------------------------------------- */
/*                                   ENERGY                                   */
/* -------------------------------------------------------------------------- */

export type EnergyState = {
  energy: number;
  maxEnergy: number;
  /** True when the daily refill was just applied during this read. */
  refilledToday: boolean;
  /** How many levels the current balance can pay for (energy / costPerLevel). */
  levelsAffordable: number;
};

/** Ensure the single energy row exists (idempotent). */
const ensureEnergyRow = async () => {
  // lastSeen starts NULL so the first getEnergy() read applies the daily
  // refill — giving brand-new players their starting energy immediately.
  await sqlite.runAsync(
    `INSERT OR IGNORE INTO story_energy (id, energy, lastSeen)
     VALUES (?, 0, NULL)`,
    [ENERGY_ROW_ID],
  );
};

/**
 * Reads the current energy balance, applying a once-per-day refill if the last
 * time we saw the player was a previous calendar day. The refill keeps the game
 * from dead-ending while still rewarding real habit completions as the primary
 * source of energy.
 */
export const getEnergy = async (): Promise<EnergyState> => {
  await ensureEnergyRow();
  const row: any = await sqlite.getFirstAsync(
    `SELECT energy, lastSeen FROM story_energy WHERE id = ?`,
    [ENERGY_ROW_ID],
  );

  let energy = Number(row?.energy ?? 0);
  const lastSeen = row?.lastSeen as string | null;
  const today = getToday();
  let refilledToday = false;

  if (lastSeen !== today) {
    energy = Math.min(MAX_ENERGY, energy + DAILY_REFILL);
    refilledToday = true;
  }

  // Always stamp "seen today" so the refill only fires once per day.
  await sqlite.runAsync(
    `UPDATE story_energy SET energy = ?, lastSeen = ? WHERE id = ?`,
    [energy, today, ENERGY_ROW_ID],
  );

  return {
    energy,
    maxEnergy: MAX_ENERGY,
    refilledToday,
    levelsAffordable: Math.floor(energy / COST_PER_LEVEL),
  };
};

/** Adds energy (e.g. from a habit completion), clamped to the cap. */
export const addEnergy = async (amount: number): Promise<number> => {
  await ensureEnergyRow();
  const row: any = await sqlite.getFirstAsync(
    `SELECT energy FROM story_energy WHERE id = ?`,
    [ENERGY_ROW_ID],
  );
  const next = Math.min(MAX_ENERGY, Number(row?.energy ?? 0) + amount);
  await sqlite.runAsync(`UPDATE story_energy SET energy = ? WHERE id = ?`, [
    next,
    ENERGY_ROW_ID,
  ]);
  return next;
};

/** Spends energy if the balance allows it. Returns false when insufficient. */
export const spendEnergy = async (amount: number): Promise<boolean> => {
  await ensureEnergyRow();
  const row: any = await sqlite.getFirstAsync(
    `SELECT energy FROM story_energy WHERE id = ?`,
    [ENERGY_ROW_ID],
  );
  const current = Number(row?.energy ?? 0);
  if (current < amount) return false;
  await sqlite.runAsync(`UPDATE story_energy SET energy = ? WHERE id = ?`, [
    current - amount,
    ENERGY_ROW_ID,
  ]);
  return true;
};

/* -------------------------------------------------------------------------- */
/*                                  PROGRESS                                  */
/* -------------------------------------------------------------------------- */

/** Set of completed level ids (fast membership checks for unlock logic). */
export const getCompletedNodeIds = async (): Promise<Set<string>> => {
  const rows: any[] = await sqlite.getAllAsync(
    `SELECT nodeId FROM story_progress`,
  );
  return new Set(rows.map((r) => r.nodeId));
};

export const hasCompletedNode = async (nodeId: string): Promise<boolean> => {
  const row = await sqlite.getFirstAsync(
    `SELECT nodeId FROM story_progress WHERE nodeId = ? LIMIT 1`,
    [nodeId],
  );
  return !!row;
};

/** Best star rating earned per level (1-3). Missing = not yet solved. */
export const getStarsByNode = async (): Promise<Record<string, number>> => {
  const rows: any[] = await sqlite.getAllAsync(
    `SELECT nodeId, stars FROM story_progress`,
  );
  return Object.fromEntries(
    rows.map((r) => [r.nodeId, Number(r.stars ?? 1) || 1]),
  );
};

/** Total stars collected across the story (for the map's completion badge). */
export const getTotalStars = async (): Promise<number> => {
  const row: any = await sqlite.getFirstAsync(
    `SELECT COALESCE(SUM(stars), 0) AS total FROM story_progress`,
  );
  return Number(row?.total || 0);
};

/** Total XP earned from the story so far (mirrors habit/challenge XP totals). */
export const getStoryXPEarned = async (): Promise<number> => {
  const row: any = await sqlite.getFirstAsync(
    `SELECT COALESCE(SUM(xpEarned), 0) AS total FROM story_progress`,
  );
  return Number(row?.total || 0);
};

export type SolveResult =
  | {
      ok: true;
      reward: number;
      stars: number;
      improved: boolean;
      energyLeft: number;
    }
  | { ok: false; reason: "completed" | "locked" | "no_energy" };

/**
 * Solves a level: validates unlock + energy, spends the cost, records progress
 * and awards XP.
 *
 * A level already solved is a REPLAY, not a dead end: it still costs energy and
 * still shows the reveal, and if the new attempt scores more stars the stored
 * rating is upgraded. XP is only granted on the first clear so replaying for a
 * better score cannot be farmed.
 */
export const solveNode = async (
  level: StoryLevel,
  opts: { mistakes: number; hintsUsed: number } = { mistakes: 0, hintsUsed: 0 },
): Promise<SolveResult> => {
  const alreadyDone = await hasCompletedNode(level.id);

  if (!alreadyDone && !isLevelUnlocked(level.id, await getCompletedNodeIds())) {
    return { ok: false, reason: "locked" };
  }

  const cost = level.cost ?? COST_PER_LEVEL;
  const spent = await spendEnergy(cost);
  if (!spent) return { ok: false, reason: "no_energy" };

  const { stars } = starsFor(opts.mistakes, opts.hintsUsed);
  let improved = false;

  if (!alreadyDone) {
    await sqlite.runAsync(
      `INSERT OR REPLACE INTO story_progress
         (nodeId, chapterId, xpEarned, stars, mistakes, hintsUsed, completedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        level.id,
        getChapterIdOf(level.id),
        level.reward,
        stars,
        opts.mistakes,
        opts.hintsUsed,
        new Date().toISOString(),
      ],
    );
    // Feed the real XP/level system so story progress shows everywhere.
    await addXP(level.reward);
  } else {
    // Capture the previous rating BEFORE overwriting it, so we can report
    // whether this replay actually beat the player's best.
    const before: any = await sqlite.getFirstAsync(
      `SELECT stars FROM story_progress WHERE nodeId = ? LIMIT 1`,
      [level.id],
    );
    const previous = Number(before?.stars ?? 0) || 0;
    if (stars > previous) {
      improved = true;
      await sqlite.runAsync(
        `UPDATE story_progress SET stars = ?, mistakes = ?, hintsUsed = ?
          WHERE nodeId = ?`,
        [stars, opts.mistakes, opts.hintsUsed, level.id],
      );
    }
  }

  const energyRow: any = await sqlite.getFirstAsync(
    `SELECT energy FROM story_energy WHERE id = ?`,
    [ENERGY_ROW_ID],
  );

  return {
    ok: true,
    // XP only on the first clear, so replaying for stars cannot be farmed.
    reward: alreadyDone ? 0 : level.reward,
    stars,
    improved,
    energyLeft: Number(energyRow?.energy ?? 0),
  };
};

const chapterCache = new Map<string, string>();
const getChapterIdOf = (levelId: string): string => {
  const cached = chapterCache.get(levelId);
  if (cached) return cached;
  const chapter = LEVELS.find((l) => l.id === levelId);
  const id = chapterIdFallback(levelId);
  chapterCache.set(levelId, id);
  return id;
};

/** Chapter id is encoded in the level id ("ch2-l3" -> "ch2"). */
const chapterIdFallback = (levelId: string): string =>
  levelId.split("-")[0] ?? "ch1";

/** The next level the player can attempt (unlocked + not yet completed). */
export const getNextPlayableNode = async (): Promise<StoryLevel | null> => {
  const completed = await getCompletedNodeIds();
  return (
    LEVELS.find(
      (l) => !completed.has(l.id) && isLevelUnlocked(l.id, completed),
    ) ?? null
  );
};

