/**
 * The puzzle registry — one surface every puzzle kind answers to.
 *
 * A "session" is the mutable per-attempt state (what the player has typed,
 * tapped or dragged). Each kind provides:
 *
 *   `buildSession(level)` -> a session, pre-shuffled and ready to render
 *   `gradeSession(s)`     -> { progress, complete, … } for the praise system
 *   `applyHint(s)`        -> a new session with one more thing filled in
 *
 * The UI only ever calls those three, so adding a sixth puzzle kind means
 * adding one entry here plus one body component — nothing else in the game has
 * to know the difference between a crossword and a word search.
 */

import {
  getDifficultyForIndex,
  shuffled,
  type ChoicePuzzle,
  type OrderPuzzle,
  type Puzzle,
  type StoryLevel,
} from "@/data/story";
import { buildBlanks, gradeBlanks, type BlanksPuzzleModel } from "./blanks";
import {
  applyClueToState,
  buildCrossword,
  createCrosswordState,
  gradeCrossword,
  unsolvedClueIds,
  type CrosswordGrid,
  type CrosswordState,
} from "./crossword";
import { createRng } from "./rng";

/* ------------------------------- Sessions -------------------------------- */

export type BlanksSession = {
  kind: "blanks";
  model: BlanksPuzzleModel;
  /** One entry per blank; null while empty. */
  answers: (string | null)[];
};

export type ChoiceSession = {
  kind: "choice";
  puzzle: ChoicePuzzle;
  /** Shuffled option order (stable per level). */
  order: number[];
  picked: number | null;
};

export type OrderSession = {
  kind: "order";
  puzzle: OrderPuzzle;
  /** Shuffled item indices still available to place. */
  pool: number[];
  /** Original item indices, in the order the player placed them. */
  placed: number[];
};

export type CrosswordSession = {
  kind: "crossword";
  grid: CrosswordGrid;
  state: CrosswordState;
  /** Index into `grid.clues` of the currently selected clue. */
  activeClue: number;
  hintsUsed: number;
};

export type MemorySession = {
  kind: "memory";
  pairs: string[];
  /** Shuffled deck — each pair word appears twice. */
  cards: string[];
  /** Card indices already matched. */
  matched: number[];
  hintsUsed: number;
};

export type PuzzleSession =
  | BlanksSession
  | ChoiceSession
  | OrderSession
  | CrosswordSession
  | MemorySession;

export type SessionGrade = {
  /** 0..1 */
  progress: number;
  complete: boolean;
  /** Human-readable nudge, e.g. "3 words to go". */
  hintLabel: string;
};

/* -------------------------------- Builders ------------------------------- */

const longest = (words: string[]): number =>
  words.reduce((m, w) => Math.max(m, w.length), 0);

const buildBlanksSession = (level: StoryLevel): BlanksSession => {
  const p = level.puzzle as Extract<Puzzle, { kind: "blanks" }>;
  return {
    kind: "blanks",
    model: buildBlanks(p.verse, p.answer, p.bank, level.id),
    answers: p.answer.map(() => null),
  };
};

const buildChoiceSession = (level: StoryLevel): ChoiceSession => {
  const p = level.puzzle as Extract<Puzzle, { kind: "choice" }>;
  return {
    kind: "choice",
    puzzle: p,
    order: shuffled(
      p.options.map((_, i) => i),
      level.id + "-choice",
    ),
    picked: null,
  };
};

const buildOrderSession = (level: StoryLevel): OrderSession => {
  const p = level.puzzle as Extract<Puzzle, { kind: "order" }>;
  return {
    kind: "order",
    puzzle: p,
    pool: shuffled(
      p.items.map((_, i) => i),
      level.id + "-order",
    ),
    placed: [],
  };
};

const buildCrosswordSession = (level: StoryLevel): CrosswordSession => {
  const p = level.puzzle as Extract<Puzzle, { kind: "crossword" }>;
  const grid = buildCrossword(p.clues, level.id);
  return {
    kind: "crossword",
    grid,
    state: createCrosswordState(grid),
    activeClue: 0,
    hintsUsed: 0,
  };
};

const buildMemorySession = (level: StoryLevel): MemorySession => {
  const p = level.puzzle as Extract<Puzzle, { kind: "memory" }>;
  const tier = getDifficultyForIndex(level.index);
  const pairs = p.pairs.slice(0, tier.memoryPairs);
  const cards = shuffled([...pairs, ...pairs], level.id + "-memory");
  return {
    kind: "memory",
    pairs,
    cards,
    matched: [],
    hintsUsed: 0,
  };
};

/** Build the playable session for a level. */
export const buildSession = (level: StoryLevel): PuzzleSession => {
  switch (level.puzzle.kind) {
    case "blanks":
      return buildBlanksSession(level);
    case "choice":
      return buildChoiceSession(level);
    case "order":
      return buildOrderSession(level);
    case "crossword":
      return buildCrosswordSession(level);
    case "memory":
      return buildMemorySession(level);
  }
};

/* --------------------------------- Grading ------------------------------- */

const remaining = (n: number, word: string) =>
  n <= 0 ? "all restored" : `${n} ${word}${n === 1 ? "" : "s"} to go`;

export const gradeSession = (s: PuzzleSession): SessionGrade => {
  switch (s.kind) {
    case "blanks": {
      const g = gradeBlanks(s.model, s.answers);
      return {
        progress: g.progress,
        complete: g.complete,
        hintLabel: remaining(g.totalCount - g.correctCount, "word"),
      };
    }
    case "choice":
      return {
        progress: s.picked === null ? 0 : 1,
        complete: s.picked !== null,
        hintLabel: s.picked === null ? "choose a response" : "chosen",
      };
    case "order":
      return {
        progress: s.placed.length / s.puzzle.items.length,
        complete: s.placed.length === s.puzzle.items.length,
        hintLabel: remaining(s.puzzle.items.length - s.placed.length, "piece"),
      };
    case "crossword": {
      const g = gradeCrossword(s.grid, s.state);
      return {
        progress: g.progress,
        complete: g.complete,
        hintLabel: remaining(g.totalCells - g.correctCells, "letter"),
      };
    }
    case "memory": {
      const total = s.cards.length;
      return {
        progress: total === 0 ? 0 : s.matched.length / total,
        complete: total > 0 && s.matched.length === total,
        hintLabel: remaining((total - s.matched.length) / 2, "pair"),
      };
    }
  }
};

/* ---------------------------------- Hints -------------------------------- */

/**
 * Return a copy of the session with one more piece filled in.
 *
 * Blanks/crossword/word search fill the next empty thing. Choice and order lock
 * in the next correct piece so the player keeps the rest of the work — a hint
 * should never hand over the whole answer.
 */
export const applyHint = (s: PuzzleSession): PuzzleSession => {
  switch (s.kind) {
    case "blanks": {
      const nextBlank = s.answers.findIndex((a) => a === null);
      if (nextBlank < 0) return s;
      const answers = [...s.answers];
      const blank = s.model.tokens.filter(
        (t): t is Extract<typeof t, { type: "blank" }> => t.type === "blank",
      )[nextBlank];
      answers[nextBlank] = blank.answer;
      return { ...s, answers };
    }
    case "choice":
      return {
        ...s,
        picked: s.puzzle.options.findIndex((o) => o.correct),
      };
    case "order": {
      if (s.pool.length === 0) return s;
      const wanted = s.puzzle.items.indexOf(
        s.puzzle.correctOrder[s.placed.length],
      );
      if (wanted < 0 || !s.pool.includes(wanted)) return s;
      return {
        ...s,
        pool: s.pool.filter((i) => i !== wanted),
        placed: [...s.placed, wanted],
      };
    }
    case "crossword": {
      const grade = gradeCrossword(s.grid, s.state);
      const open = unsolvedClueIds(s.grid, grade);
      if (open.length === 0) return s;
      const rng = createRng(`${s.grid.rows}x${s.grid.cols}-hint${s.hintsUsed}`);
      const target = open[rng.int(open.length)];
      return {
        ...s,
        state: applyClueToState(s.grid, s.state, target),
        hintsUsed: s.hintsUsed + 1,
        activeClue: target,
      };
    }
    case "memory": {
      const word = s.pairs.find((w) => {
        const indices = s.cards
          .map((c, i) => (c === w ? i : -1))
          .filter((i) => i >= 0);
        return !indices.every((i) => s.matched.includes(i));
      });
      if (!word) return s;
      const indices = s.cards
        .map((c, i) => (c === word ? i : -1))
        .filter((i) => i >= 0);
      return {
        ...s,
        matched: [...s.matched, ...indices],
        hintsUsed: s.hintsUsed + 1,
      };
    }
  }
};

/** Hints consumed so far (drives the star penalty). */
export const hintCount = (s: PuzzleSession): number => {
  if (s.kind === "crossword") return s.hintsUsed;
  if (s.kind === "memory") return s.hintsUsed;
  return 0;
};
