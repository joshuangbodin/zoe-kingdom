
/**
 * PuzzleBody
 *
 * Routes each puzzle session to its presentation component.
 * Owns submission controls and coordinates session updates,
 * feedback and puzzle interactions.
 */

import React from "react";
import { View } from "react-native";

import type { StoryLevel } from "@/data/story";

import {
  type ChoiceSession,
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

/* --------------------------------- Helpers -------------------------------- */

export const puzzleLabel = (kind: string): string =>
  ({
    blanks: "Complete the Verses",
    choice: "Choose the Response",
    order: "Rebuild the Promise",
    crossword: "Crossword Lattice",
    memory: "Verse Memory",
  })[kind] ?? kind;

/* --------------------------------- Props ---------------------------------- */

type Props = {
  session: PuzzleSession;
  level: StoryLevel;
  accent: string;
  isDark: boolean;
  hintsLeft: number;
  hintText: string | null;
  hintActive: boolean;
  onHint: () => void;
  onFeedback: (correct: boolean) => void;
  onChange: (session: PuzzleSession) => void;
  onSubmit: () => void;
  complete: boolean;
};

/* -------------------------------- Component ------------------------------- */

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

  // Keep the latest session available to delayed interactions.
  const sessionRef = React.useRef(session);
  sessionRef.current = session;

  /* -------------------------------- Blanks -------------------------------- */

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
            const answers = [...session.answers];
            const next = answers.findIndex((answer) => answer === null);

            if (next < 0) return;

            answers[next] = word;

            const blank = session.model.tokens.filter(
              (token) => token.type === "blank",
            )[next];

            const correct =
              blank?.type === "blank" &&
              wordsMatch(word, blank.answer);

            onChange({
              ...session,
              answers,
            });

            onFeedback(correct);
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
    const choiceSession: ChoiceSession = session;

    
/* -------------------------------- Choice -------------------------------- */

if (session.kind === "choice") {
  return (
    <View>
      <ChoiceBody
        session={session}
        mission={mission}
        accent={accent}
        isDark={isDark}
        reveal={(puzzle as { reveal: string }).reveal}
        onChange={onChange}
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

  }

  /* --------------------------------- Order --------------------------------- */

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
            // Ignore fragments that are no longer available.
            if (!session.pool.includes(itemIndex)) return;

            const expectedItem =
              session.puzzle.correctOrder[session.placed.length];

            const wanted = session.puzzle.items.indexOf(expectedItem);

            const updatedSession = {
              ...session,
              pool: session.pool.filter((index) => index !== itemIndex),
              placed: [...session.placed, itemIndex],
            };

            onChange(updatedSession);
            onFeedback(itemIndex === wanted);
          }}
          onRemove={(position) => {
            if (position < 0 || position >= session.placed.length) return;

            const placed = [...session.placed];
            const [removed] = placed.splice(position, 1);

            if (removed === undefined) return;

            onChange({
              ...session,
              placed,
              pool: [...session.pool, removed],
            });
          }}
          onMoveUp={(position) => {
            if (position <= 0 || position >= session.placed.length) return;

            const placed = [...session.placed];

            [placed[position - 1], placed[position]] = [
              placed[position],
              placed[position - 1],
            ];

            onChange({
              ...session,
              placed,
            });
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
    const crosswordSession: CrosswordSession = session;

    return (
      <View>
        <CrosswordBody
          session={crosswordSession}
          mission={mission}
          reference={(puzzle as { reference?: string }).reference ?? ""}
          accent={accent}
          isDark={isDark}
          hintsLeft={hintsLeft}
          hintText={hintText}
          hintActive={hintActive}
          onHint={onHint}
          onType={(row, col, letter, correct) => {
            const entries = crosswordSession.state.entries.map(
              (currentRow) => [...currentRow],
            );

            if (!entries[row] || col < 0 || col >= entries[row].length) {
              return;
            }

            entries[row][col] = letter;

            onChange({
              ...crosswordSession,
              state: { entries },
            });

            onFeedback(correct);

            // Clear an incorrect letter after its brief feedback flash.
            if (!correct) {
              setTimeout(() => {
                const latest = sessionRef.current;

                if (latest.kind !== "crossword") return;

                const currentEntries = latest.state.entries.map(
                  (currentRow) => [...currentRow],
                );

                // Do not clear the cell if the player has already changed it.
                if (currentEntries[row]?.[col] !== letter) return;

                currentEntries[row][col] = "";

                onChange({
                  ...latest,
                  state: {
                    ...latest.state,
                    entries: currentEntries,
                  },
                });
              }, 420);
            }
          }}
          onSelectClue={(clueIndex) => {
            onChange({
              ...crosswordSession,
              activeClue: clueIndex,
            });
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

  /* -------------------------------- Memory -------------------------------- */

  const memorySession: MemorySession = session;

  return (
    <View>
      <MemoryBody
        session={memorySession}
        mission={mission}
        reference={(puzzle as { reference?: string }).reference ?? ""}
        accent={accent}
        isDark={isDark}
        hintsLeft={hintsLeft}
        hintText={hintText}
        onHint={onHint}
        onMatch={(indices) => {
          onChange({
            ...memorySession,
            matched: [...memorySession.matched, ...indices],
          });
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
