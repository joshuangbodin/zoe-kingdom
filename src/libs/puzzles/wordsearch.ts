/**
 * Word search generator + selection detection.
 *
 * Placement walks the eight compass directions (with diagonal/reverse gated by
 * the difficulty tier) and, for each word, tries every start cell in a seeded
 * random order until one fits without breaking an already-placed word. Words are
 * placed longest-first, and overlapping is allowed when the shared letter
 * matches — that is what makes late words find room in a tight grid.
 *
 * The remaining cells are filled with plausible filler letters biased AWAY from
 * the letters of the words being hunted, so a lucky diagonal read never
 * accidentally spells a target word.
 *
 * `cellsForSelection` turns a drag (from-cell -> to-cell) into the exact set of
 * cells the player highlighted, snapping a sloppy drag onto the nearest straight
 * line so the puzzle feels forgiving without being unfair.
 */

import { createRng, type Rng } from "./rng";

export type Direction = {
  dr: number;
  dc: number;
  /** True when the word reads right-to-left or bottom-to-top. */
  reversed: boolean;
  /** True when the word runs diagonally. */
  diagonal: boolean;
};

export const DIRECTIONS: Direction[] = [
  { dr: 0, dc: 1, reversed: false, diagonal: false }, // →
  { dr: 1, dc: 0, reversed: false, diagonal: false }, // ↓
  { dr: 1, dc: 1, reversed: false, diagonal: true }, // ↘
  { dr: 1, dc: -1, reversed: false, diagonal: true }, // ↙
  { dr: 0, dc: -1, reversed: true, diagonal: false }, // ←
  { dr: -1, dc: 0, reversed: true, diagonal: false }, // ↑
  { dr: -1, dc: -1, reversed: true, diagonal: true }, // ↖
  { dr: -1, dc: 1, reversed: true, diagonal: true }, // ↗
];

export type WordSearchPlacement = {
  word: string;
  /** Cells in the word's reading order. */
  cells: { row: number; col: number }[];
  dir: Direction;
  row: number;
  col: number;
};

export type WordSearchGrid = {
  size: number;
  /** `grid[row][col]` — one uppercase letter per cell. */
  grid: string[][];
  placements: WordSearchPlacement[];
};

export type WordSearchOptions = {
  diagonal: boolean;
  reverse: boolean;
};

export const normalizeWord = (w: string) =>
  w.toUpperCase().replace(/[^A-Z]/g, "");

const allowedDirections = (opts: WordSearchOptions): Direction[] =>
  DIRECTIONS.filter((d) => {
    if (d.diagonal && !opts.diagonal) return false;
    if (d.reversed && !opts.reverse) return false;
    return true;
  });

/**
 * Can `word` be written from (row, col) along `dir`?
 * Empty cells are free; occupied cells must already hold the same letter.
 */
const fits = (
  grid: string[][],
  size: number,
  word: string,
  row: number,
  col: number,
  dir: Direction,
): boolean => {
  for (let i = 0; i < word.length; i++) {
    const r = row + dir.dr * i;
    const c = col + dir.dc * i;
    if (r < 0 || c < 0 || r >= size || c >= size) return false;
    const existing = grid[r][c];
    if (existing && existing !== word[i]) return false;
  }
  return true;
};

const write = (
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: Direction,
) => {
  for (let i = 0; i < word.length; i++) {
    grid[row + dir.dr * i][col + dir.dc * i] = word[i];
  }
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Build a word search grid for `words` at `size` x `size`.
 *
 * Words longer than `size` are skipped (they could never fit). Words that find
 * no legal slot after exhausting every cell/direction are also skipped, so the
 * generator always returns a valid grid rather than throwing.
 */
export const buildWordSearch = (
  words: string[],
  size: number,
  seed: string,
  opts: WordSearchOptions,
): WordSearchGrid => {
  const rng: Rng = createRng(seed);
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );

  const dirs = allowedDirections(opts);
  const placements: WordSearchPlacement[] = [];

  // Longest first — short words squeeze into the gaps the long ones leave.
  const targets = words
    .map((w) => normalizeWord(w))
    .filter((w) => w.length >= 2 && w.length <= size)
    .sort((a, b) => b.length - a.length);

  for (const word of targets) {
    // Every (cell, direction) pair, in seeded random order.
    const attempts: { row: number; col: number; dir: Direction }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        for (const dir of dirs) attempts.push({ row: r, col: c, dir });
      }
    }
    const order = rng.shuffle(attempts);

    // Prefer a slot that overlaps existing letters (tighter, prettier grids),
    // but fall back to a clean slot when no overlap is available.
    let chosen: { row: number; col: number; dir: Direction } | null = null;
    let fallback: { row: number; col: number; dir: Direction } | null = null;

    for (const a of order) {
      if (!fits(grid, size, word, a.row, a.col, a.dir)) continue;
      const overlaps = word
        .split("")
        .some((ch, i) => grid[a.row + a.dir.dr * i][a.col + a.dir.dc * i] === ch);
      if (overlaps) {
        chosen = a;
        break;
      }
      if (!fallback) fallback = a;
    }

    const slot = chosen ?? fallback;
    if (!slot) continue;

    write(grid, word, slot.row, slot.col, slot.dir);
    placements.push({
      word,
      row: slot.row,
      col: slot.col,
      dir: slot.dir,
      cells: Array.from({ length: word.length }, (_, i) => ({
        row: slot.row + slot.dir.dr * i,
        col: slot.col + slot.dir.dc * i,
      })),
    });
  }

  /* ------------------------------ Fill the rest ---------------------------- */

  // Bias filler letters away from the target letters so accidental reads of a
  // hidden word stay rare.
  const targetLetters = new Set(targets.join("").split(""));
  const fillerPool = ALPHABET.filter((ch) => !targetLetters.has(ch));
  const pool = fillerPool.length >= 8 ? fillerPool : ALPHABET;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = pool[rng.int(pool.length)];
    }
  }

  return { size, grid, placements };
};

/** The words that were actually placed. */
export const findAllWords = (g: WordSearchGrid): string[] =>
  g.placements.map((p) => p.word);

/** Independently re-find `word` on a finished grid (verification / reveal). */
export const verifyWordOnGrid = (
  grid: string[][],
  word: string,
): WordSearchPlacement | null => {
  const size = grid.length;
  const w = normalizeWord(word);

  for (const dir of DIRECTIONS) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        let ok = true;
        for (let i = 0; i < w.length; i++) {
          const rr = r + dir.dr * i;
          const cc = c + dir.dc * i;
          if (
            rr < 0 ||
            cc < 0 ||
            rr >= size ||
            cc >= size ||
            grid[rr][cc] !== w[i]
          ) {
            ok = false;
            break;
          }
        }
        if (ok) {
          return {
            word: w,
            row: r,
            col: c,
            dir,
            cells: Array.from({ length: w.length }, (_, i) => ({
              row: r + dir.dr * i,
              col: c + dir.dc * i,
            })),
          };
        }
      }
    }
  }
  return null;
};

/**
 * Turn a drag from `from` to `to` into the highlighted cells.
 *
 * A perfect drag is a straight line in one of the eight directions. A sloppy
 * drag is snapped: pure axes always work, and a diagonal is accepted when the
 * two deltas are within one cell of each other. Returns null when the gesture
 * is not line-like enough to be a deliberate selection.
 */
export const cellsForSelection = (
  from: { row: number; col: number },
  to: { row: number; col: number },
): { row: number; col: number }[] | null => {
  const dr = to.row - from.row;
  const dc = to.col - from.col;

  if (dr === 0 && dc === 0) return [{ ...from }];

  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if (dr === 0) {
    return Array.from({ length: adc + 1 }, (_, i) => ({
      row: from.row,
      col: from.col + Math.sign(dc) * i,
    }));
  }
  if (dc === 0) {
    return Array.from({ length: adr + 1 }, (_, i) => ({
      row: from.row + Math.sign(dr) * i,
      col: from.col,
    }));
  }

  if (Math.abs(adr - adc) <= 1) {
    const n = Math.max(adr, adc);
    return Array.from({ length: n + 1 }, (_, i) => ({
      row: from.row + Math.sign(dr) * i,
      col: from.col + Math.sign(dc) * i,
    }));
  }

  return null;
};

/** The letters a selection spells, in order. */
export const selectionWord = (
  grid: string[][],
  cells: { row: number; col: number }[],
): string => cells.map((c) => grid[c.row]?.[c.col] ?? "").join("");
