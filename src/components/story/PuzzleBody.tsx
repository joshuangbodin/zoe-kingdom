/**
 * PuzzleBody — routes a session to its presentation and owns the submit button.
 *
 * This is the only place that knows all five puzzle kinds exist. Each body
 * reports intent back up ("place this word", "type this letter"), the router
 * applies it to the session through the pure helpers in `libs/puzzles`, and
 * re-grades so the SUBMIT button unlocks exactly when the puzzle is genuinely
 * complete.
 */

import React from "react";
import { View } from "react-native";

import type { StoryLevel } from "@/data/story";
import {
  type CrosswordSession,
  type MemorySession,
  type PuzzleSession,
} from "@/libs/puzzles";
import { wordsMatch } from "@/libs/puzzles/blanks";

import BlanksBody from "./puzzle/BlanksBody";
import { ChoiceBody, OrderBody } from "./puzzle/ChoiceAndOrderBody";
import CrosswordBody from "./puzzle/CrosswordBody";
import MemoryBody from "./puzzle/MemoryBody";
import SubmitBar from "./SubmitBar";

export const puzzleLabel = (kind: string): string =>
  ({
    blanks: "Complete the Verses",
    choice: "Choose the Response",
    order: "Rebuild the Promise",
    crossword: "Crossword Lattice",
    memory: "Verse Memory",
  })[kind] ?? kind;

type Props = {
  session: PuzzleSession;
  level: StoryLevel;
  accent: string;
  isDark: boolean;
  hintsLeft: number;
  hintText: string | null;
  hintActive: boolean;
  onHint: () => void;
  /** Praise/mistake reporting. */
  onFeedback: (correct: boolean) => void;
  onChange: (session: PuzzleSession) => void;
  onSubmit: () => void;
  complete: boolean;
};

export default function PuzzleBody({
  session,
  level,
  accent,
  isDark,
  hintsLeft,
  hintText,
  hintActive,
  onHint,
  onFeedback,
  onChange,
  onSubmit,
  complete,
}: Props) {
  const puzzle = level.puzzle;
  const mission = level.mission;

  /* ------------------------------- Blanks --------------------------------- */

  if (session.kind === "blanks") {
    return (
      <View>
        <BlanksBody
          session={session}
          mission={mission}
          reference={(puzzle as { reference: string }).reference}
          accent={accent}
          isDark={isDark}
          hintsLeft={hintsLeft}
          hintText={hintText}
          onHint={onHint}
          onPlace={(word) => {
            // Fill the next empty blank, then report whether it was right.
            const answers = [...session.answers];
            const next = answers.findIndex((a) => a === null);
            if (next < 0) return;
            answers[next] = word;
            const blank = session.model.tokens.filter(
              (t) => t.type === "blank",
            )[next];
            const right =
              blank?.type === "blank" && wordsMatch(word, blank.answer);
            onChange({ ...session, answers });
            onFeedback(right);
          }}
        />
        <SubmitBar
          complete={complete}
          accent={accent}
          cost={level.cost}
          onSubmit={onSubmit}
        />
      </View>
    );
  }

  /* -------------------------------- Choice -------------------------------- */

  if (session.kind === "choice") {
    return (
      <ChoiceBody
        session={session}
        mission={mission}
        accent={accent}
        isDark={isDark}
        reveal={(puzzle as { reveal: string }).reveal}
      />
    );
  }

  /* --------------------------------- Order -------------------------------- */

  if (session.kind === "order") {
    return (
      <View>
        <OrderBody
          session={session}
          mission={mission}
          prompt={(puzzle as { prompt: string }).prompt}
          accent={accent}
          isDark={isDark}
          onPlace={(itemIndex) => {
            const wanted = session.puzzle.items.indexOf(
              session.puzzle.correctOrder[session.placed.length],
            );
            onChange({
              ...session,
              pool: session.pool.filter((i) => i !== itemIndex),
              placed: [...session.placed, itemIndex],
            });
            onFeedback(itemIndex === wanted);
          }}
          onRemove={(position) => {
            const placed = [...session.placed];
            const [removed] = placed.splice(position, 1);
            onChange({ ...session, placed, pool: [...session.pool, removed] });
          }}
          onMoveUp={(position) => {
            const placed = [...session.placed];
            [placed[position - 1], placed[position]] = [
              placed[position],
              placed[position - 1],
            ];
            onChange({ ...session, placed });
          }}
        />
        <SubmitBar
          complete={complete}
          accent={accent}
          cost={level.cost}
          onSubmit={onSubmit}
        />
      </View>
    );
  }

  /* ------------------------------- Crossword ------------------------------ */

  if (session.kind === "crossword") {
    const cw = session as CrosswordSession;
    return (
      <View>
        <CrosswordBody
          session={cw}
          mission={mission}
          reference={(puzzle as { reference?: string }).reference ?? ""}
          accent={accent}
          isDark={isDark}
          hintsLeft={hintsLeft}
          hintText={hintText}
          hintActive={hintActive}
          onHint={onHint}
          onType={(row, col, letter, correct) => {
            const entries = cw.state.entries.map((r) => [...r]);
            entries[row][col] = letter;
            onChange({ ...cw, state: { entries } });
            onFeedback(correct);

            // A wrong letter flashes, then clears, so the grid never lies.
            if (!correct) {
              setTimeout(() => {
                const cleared = cw.state.entries.map((r) => [...r]);
                cleared[row][col] = "";
                onChange({ ...cw, state: { entries: cleared } });
              }, 420);
            }
          }}
          onSelectClue={(clueIndex) => onChange({ ...cw, activeClue: clueIndex })}
        />
        <SubmitBar
          complete={complete}
          accent={accent}
          cost={level.cost}
          onSubmit={onSubmit}
        />
      </View>
    );
  }

  /* -------------------------------- Memory -------------------------------- */

  const mem = session as MemorySession;
  return (
    <View>
      <MemoryBody
        session={mem}
        mission={mission}
        reference={(puzzle as { reference?: string }).reference ?? ""}
        accent={accent}
        isDark={isDark}
        hintsLeft={hintsLeft}
        hintText={hintText}
        onHint={onHint}
        onMatch={(indices) => {
          onChange({ ...mem, matched: [...mem.matched, ...indices] });
        }}
        onFeedback={onFeedback}
      />
      <SubmitBar
        complete={complete}
        accent={accent}
        cost={level.cost}
        onSubmit={onSubmit}
      />
    </View>
  );
}
