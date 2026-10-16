/**
 * Star scoring — the single source of truth for "how well did you restore this
 * page?".
 *
 *  3 stars — restored flawlessly (no wrong submissions, no hints)
 *  2 stars — restored with a couple of smudges
 *  1 star  — restored, but the Keeper had to help
 *
 * The thresholds live in `game.json -> stars` so the whole curve is tunable
 * without touching code. Every puzzle kind funnels through here, which is what
 * keeps the map's star badges comparable across a word search and a crossword.
 */

import { FEEDBACK, STAR_RULES } from "@/data/story";

export type StarResult = {
  stars: number;
  note: string;
};

/**
 * The per-star note copy. Authored under `game.json -> feedback.starNotes`
 * (it is player-facing praise, so it lives with the rest of the copy). Defaulted
 * here so a config edit can never crash a solve.
 */
const STAR_NOTES: Record<string, string> = {
  "1": "The page holds — barely.",
  "2": "Restored, with a few smudges.",
  "3": "Flawless restoration!",
  ...((FEEDBACK as unknown as { starNotes?: Record<string, string> })
    .starNotes ?? {}),
};

/** Band mistakes/hints into the 3/2/1 star ratings the star rules describe. */
export const starsFor = (mistakes: number, hintsUsed: number): StarResult => {
  const perfect = STAR_RULES.perfectMistakes as number;
  const ok = STAR_RULES.okMistakes as number;

  let stars: number;
  if (mistakes <= perfect && hintsUsed === 0) stars = 3;
  else if (mistakes <= ok && hintsUsed <= 1) stars = 2;
  else stars = 1;

  return { stars, note: STAR_NOTES[String(stars)] ?? "" };
};
