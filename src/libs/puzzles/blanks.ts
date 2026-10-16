/**
 * Multi-word verse restoration.
 *
 * A verse is authored with one or more `____` runs. This module splits it into a
 * token stream the UI can render as "text … blank slot … text … blank slot …",
 * and grades the player's word-by-word answers.
 *
 * Grading is deliberately per-blank so the player gets a running progress read
 * ("2 of 3 words restored") and the praise system can fire between words rather
 * than only at the end. Comparison is case- and punctuation-insensitive, so
 * "impossible." matches "impossible".
 */

import { seededShuffle } from "./rng";

/** A run of ordinary verse text between two blanks. */
export type TextToken = { type: "text"; value: string };

/** A blank the player must fill. `index` matches the answer array position. */
export type BlankToken = {
  type: "blank";
  index: number;
  /** The word the player put here, or null while empty. */
  filled: string | null;
  /** Shown once the level is solved. */
  answer: string;
};

export type VerseToken = TextToken | BlankToken;

export type BlanksPuzzleModel = {
  tokens: VerseToken[];
  /** Number of blanks to fill. */
  slotCount: number;
  /** Shuffled candidate chips (includes every answer). */
  bank: string[];
};

/** Split on any run of 2+ underscores. */
const BLANK_RE = /_{2,}/;

/** Compare words ignoring case and surrounding punctuation. */
export const wordsMatch = (a: string, b: string): boolean => {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  return clean(a) === clean(b);
};

/**
 * Build the renderable token stream + shuffled chip bank for a verse.
 *
 * `bank` is shuffled with the level id as the seed, so the chip order is stable
 * per level but not always alphabetical (which would give away the answers).
 */
export const buildBlanks = (
  verse: string,
  answers: string[],
  bank: string[],
  seed: string,
): BlanksPuzzleModel => {
  const parts = verse.split(BLANK_RE);
  const tokens: VerseToken[] = [];

  parts.forEach((part, i) => {
    if (part.trim().length > 0) {
      tokens.push({ type: "text", value: part.trim() });
    }
    if (i < parts.length - 1) {
      tokens.push({
        type: "blank",
        index: i,
        filled: null,
        answer: answers[i] ?? "",
      });
    }
  });

  return {
    tokens,
    slotCount: answers.length,
    bank: seededShuffle([...new Set(bank)], seed + "-bank"),
  };
};

export type BlanksGrade = {
  /** 0..1 across blanks. */
  progress: number;
  correctCount: number;
  totalCount: number;
  /** Per-blank correctness, aligned to the answer array. */
  perBlank: boolean[];
  complete: boolean;
  /** The verse with the player's words spliced in (for the reveal readout). */
  rendered: string;
};

/** Grade a set of player answers (index-aligned with the verse's blanks). */
export const gradeBlanks = (
  model: BlanksPuzzleModel,
  answers: (string | null)[],
): BlanksGrade => {
  const perBlank = model.tokens
    .filter((t): t is BlankToken => t.type === "blank")
    .map((t) => !!answers[t.index] && wordsMatch(answers[t.index] as string, t.answer));

  const correctCount = perBlank.filter(Boolean).length;
  const totalCount = perBlank.length;

  const rendered = model.tokens
    .map((t) => {
      if (t.type === "text") return t.value;
      return answers[t.index] ?? "____";
    })
    .join(" ");

  return {
    progress: totalCount === 0 ? 0 : correctCount / totalCount,
    correctCount,
    totalCount,
    perBlank,
    complete: totalCount > 0 && correctCount === totalCount,
    rendered,
  };
};
