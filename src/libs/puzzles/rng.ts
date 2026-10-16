/**
 * Deterministic pseudo-randomness for puzzle generation.
 *
 * Every generated grid is derived from a seed string, so a level always builds
 * the same layout on every device and every launch — the puzzle is stable while
 * still looking "random". That is what lets us cache nothing and still keep a
 * crossword identical between the dialogue, the puzzle and a re-open.
 */

/** FNV-1a string hash -> uint32. Fast, well-spread, no dependencies. */
export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export type Rng = {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [0, max). */
  int: (max: number) => number;
  /** Uniform pick from a non-empty array. */
  pick: <T>(items: T[]) => T;
  /** Fisher-Yates copy. */
  shuffle: <T>(items: T[]) => T[];
};

/** mulberry32 — small, fast, good enough for puzzle layouts. */
export const createRng = (seed: string): Rng => {
  let a = hashString(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number) => (max <= 0 ? 0 : Math.floor(next() * max) % max);
  const pick = <T,>(items: T[]): T => items[int(items.length)];
  const shuffle = <T,>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  return { next, int, pick, shuffle };
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** A random uppercase filler letter. */
export const randomLetter = (rng: Rng): string => rng.pick(LETTERS.split(""));

/**
 * Deterministic seeded shuffle used by the puzzle builders, so a level always
 * lays out identically on every device (see the note at the top of this file).
 */
export const seededShuffle = <T,>(items: T[], seed: string): T[] =>
  createRng(seed).shuffle(items);
