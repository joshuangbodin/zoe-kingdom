/**
 * Typed loader for the story-game data.
 *
 * All game content lives in the `src/data/story` JSON files so the story, the
 * cast, the feedback copy and the difficulty ramp can be edited without touching
 * a line of TypeScript. This module is the single import surface the app uses:
 * it re-exports strongly-typed views over that JSON plus the small pure helpers
 * the UI needs (unlock logic, difficulty tier lookup, cast lookup).
 *
 * Everything here is deterministic and offline — no network, no side effects.
 */

import ch1 from "./chapters/ch1.json";
import ch2 from "./chapters/ch2.json";
import ch3 from "./chapters/ch3.json";
import ch4 from "./chapters/ch4.json";
import ch5 from "./chapters/ch5.json";
import ch6 from "./chapters/ch6.json";
import game from "./game.json";

/* ------------------------------- Puzzle data ------------------------------ */

/** Multi-word verse restoration: fill every `____` in `verse`. */
export type BlanksPuzzle = {
  kind: "blanks";
  reference: string;
  verse: string;
  /** One entry per blank, in reading order. */
  answer: string[];
  /** Candidate chips, includes every answer. */
  bank: string[];
  hints: string[];
  reveal: string;
};

/** Tap-the-right-response scenario. */
export type ChoicePuzzle = {
  kind: "choice";
  prompt: string;
  options: { label: string; correct: boolean }[];
  hints: string[];
  reveal: string;
};

/** Arrange shuffled fragments into the spoken order. */
export type OrderPuzzle = {
  kind: "order";
  prompt: string;
  items: string[];
  correctOrder: string[];
  hints: string[];
  reveal: string;
};

/** A clue list the generator weaves into a real crossing grid. */
export type CrosswordPuzzle = {
  kind: "crossword";
  reference: string;
  clues: { dir: "across" | "down"; clue: string; answer: string }[];
  hints: string[];
  reveal: string;
};

/** Hidden words inside a generated letter grid. */
export type WordSearchPuzzle = {
  kind: "wordsearch";
  reference: string;
  words: string[];
  hints: string[];
  reveal: string;
};

export type Puzzle =
  | BlanksPuzzle
  | ChoicePuzzle
  | OrderPuzzle
  | CrosswordPuzzle
  | WordSearchPuzzle;

export type PuzzleKind = Puzzle["kind"];

/* ------------------------------ Story content ----------------------------- */

export type SpeakerId =
  | "narrator"
  | "keeper"
  | "believer"
  | "shadow"
  | "sara"
  | "thomas"
  | "ada";

/** One line of the animated dialogue. `who` maps to `CHARACTERS`. */
export type DialogueBeat = {
  who: SpeakerId;
  emotion:
    | "somber"
    | "menacing"
    | "hopeful"
    | "stern"
    | "afraid"
    | "sad"
    | "curious"
    | "thoughtful"
    | "tense"
    | "determined"
    | "fading";
  text: string;
};

/** `boss` = chapter finale, `finale` = the very last level of the story. */
export type LevelKind = "normal" | "boss" | "finale";

export type StoryLevel = {
  id: string;
  /** 1-based position across the WHOLE story (not just the chapter). */
  index: number;
  title: string;
  kind: LevelKind;
  setting: string;
  /** Energy spent to play. Always 2 (see game.json -> energy.costPerLevel). */
  cost: number;
  reward: number;
  dialogue: DialogueBeat[];
  mission: string;
  puzzle: Puzzle;
};

export type StoryChapter = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  kind: "story";
  intro: DialogueBeat[];
  levels: StoryLevel[];
};

export type Character = {
  id: SpeakerId;
  name: string;
  role: "narrator" | "mentor" | "player" | "antagonist" | "villager";
  emoji: string;
  tint: string;
  tagline: string;
};

/* --------------------------------- Data ---------------------------------- */

export const GAME = game;

export const CHARACTERS: Record<SpeakerId, Character> = Object.fromEntries(
  (game.characters as Character[]).map((c) => [c.id, c]),
) as Record<SpeakerId, Character>;

export const CHAPTERS: StoryChapter[] = [
  ch1,
  ch2,
  ch3,
  ch4,
  ch5,
  ch6,
] as unknown as StoryChapter[];

/** Every level in story order. This is the canonical flat list. */
export const LEVELS: StoryLevel[] = CHAPTERS.flatMap((c) => c.levels);

export const getCharacter = (id: SpeakerId): Character => CHARACTERS[id];

export const getChapterOfLevel = (levelId: string): StoryChapter | undefined =>
  CHAPTERS.find((c) => c.levels.some((l) => l.id === levelId));

export const getLevel = (levelId: string): StoryLevel | undefined =>
  LEVELS.find((l) => l.id === levelId);

/* -------------------------------- Helpers -------------------------------- */

export type DifficultyTier = {
  level: number;
  tier: string;
  label: string;
  blanks: number;
  crosswordWords: number;
  wordsearchWords: number;
  wordsearchSize: number;
  allowDiagonal: boolean;
  allowReverse: boolean;
  distractors: number;
};

/**
 * The difficulty band a given 1-based story index falls into. The ramp is
 * defined once in `game.json` so tuning the curve never touches code.
 */
export const getDifficultyForIndex = (index: number): DifficultyTier => {
  const ramp = (game.difficultyRamp as DifficultyTier[])
    .slice()
    .sort((a, b) => a.level - b.level);
  let tier = ramp[0];
  for (const r of ramp) if (index >= r.level) tier = r;
  return tier;
};

/** Progress percentage through the whole story (0-100). */
export const getStoryProgress = (completedIds: Set<string>): number => {
  if (LEVELS.length === 0) return 0;
  const done = LEVELS.filter((l) => completedIds.has(l.id)).length;
  return Math.round((done / LEVELS.length) * 100);
};

/**
 * Sequential unlock: a level is playable once the level before it (in flat
 * story order) is completed. Level 1 is always open.
 */
export const isLevelUnlocked = (
  levelId: string,
  completed: Set<string>,
): boolean => {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  if (i <= 0) return true;
  return completed.has(LEVELS[i - 1].id);
};

/** The next level the player can attempt right now, if any. */
export const getNextLevel = (
  completed: Set<string>,
): StoryLevel | undefined =>
  LEVELS.find((l) => !completed.has(l.id) && isLevelUnlocked(l.id, completed));

/**
 * Game ranks — deliberately SEPARATE from the app's spiritual Altar Fire
 * levels. Playing the story advances your rank here; your spiritual level is
 * still driven by total XP across habits, challenges and the story.
 */
export const getGameRank = (levelsCompleted: number) => {
  const titles = game.levelUpTitles as string[];
  const per = Math.ceil(LEVELS.length / titles.length) || 1;
  const idx = Math.min(Math.floor(levelsCompleted / per), titles.length - 1);
  return { index: idx, title: titles[idx], per, next: titles[idx + 1] ?? null };
};

/** Deterministic seeded shuffle (stable per level + purpose). */
export const shuffled = <T,>(items: T[], seed: string): T[] => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Pick a praise/feedback line deterministically for a given key. */
export const pickLine = (pool: string[], seed: string): string => {
  if (pool.length === 0) return "";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
};

export const FEEDBACK = game.feedback;
export const ENERGY_CONFIG = game.energy;
export const STAR_RULES = game.stars;
export const STORY_META = game.meta;
