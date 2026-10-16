/**
 * CrosswordBody — the crossing-lattice puzzle.
 *
 * Tapping a cell selects the clue through it (across, or down when already on an
 * across). A letter tray under the grid types into the active clue's next empty
 * cell, which is far kinder on a phone than a hidden keyboard. Correct letters
 * lock in gold, and every completed clue is struck through in the list — so a
 * 5-letter solve delivers several wins, not one.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native";

import type { CrosswordSession } from "@/libs/puzzles";
import { cellsForClue, gradeCrossword } from "@/libs/puzzles/crossword";

import { MissionLine, PuzzleFooter } from "./PuzzleChrome";
import CrosswordGrid from "./CrosswordGrid";
import LetterTray from "./LetterTray";
import ClueList from "./ClueList";

type Props = {
  session: CrosswordSession;
  mission: string;
  reference: string;
  accent: string;
  isDark: boolean;
  hintsLeft: number;
  hintText: string | null;
  onHint: () => void;
  /** Report a letter placement + whether it was right, for praise handling. */
  onType: (row: number, col: number, letter: string, correct: boolean) => void;
  /** Switch the active clue. */
  onSelectClue: (clueIndex: number) => void;
};

export default function CrosswordBody({
  session,
  mission,
  reference,
  accent,
  isDark,
  hintsLeft,
  hintText,
  onHint,
  onType,
  onSelectClue,
}: Props) {
  const { grid, state, activeClue } = session;
  const grade = gradeCrossword(grid, state);
  const clue = grid.clues[activeClue] ?? grid.clues[0];
  const clueCells = clue ? cellsForClue(grid, clue) : [];

  // First empty cell of the active clue — where the next letter lands.
  const activeCell =
    clueCells.find((c) => !(state.entries[c.row]?.[c.col] ?? "")) ?? null;
  const cellSize = Math.min(34, Math.floor(300 / Math.max(grid.cols, 1)));

  const type = (letter: string) => {
    if (!activeCell) return;
    const solution = grid.cells[activeCell.row][activeCell.col].solution ?? "";
    onType(activeCell.row, activeCell.col, letter, letter === solution);
  };

  const selectCell = (row: number, col: number) => {
    const cell = grid.cells[row][col];
    // Prefer across; switch to down when already on this across.
    const target =
      cell.acrossId !== null && cell.acrossId !== clue?.id
        ? cell.acrossId
        : (cell.downId ?? cell.acrossId);
    if (target == null) return;
    const idx = grid.clues.findIndex((cl) => cl.id === target);
    if (idx >= 0) onSelectClue(idx);
  };

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <CrosswordGrid
        grid={grid}
        state={state}
        accent={accent}
        isDark={isDark}
        activeCells={new Set(clueCells.map((c) => `${c.row},${c.col}`))}
        cellSize={cellSize}
        onCellPress={selectCell}
      />

      {/* ------------------------------ Active clue -------------------------- */}
      {clue && (
        <View
          className="rounded-2xl px-3.5 py-3 mb-3 flex-row items-center"
          style={{ backgroundColor: accent + "14" }}
        >
          <View className="flex-1 min-w-0">
            <Text
              className="text-[10px] font-sora-bold tracking-widest mb-0.5"
              style={{ color: accent }}
            >
              {clue.number} {clue.dir.toUpperCase()}
            </Text>
            <Text className="text-primary text-[12px] font-sora-medium leading-4">
              {clue.clue}
            </Text>
          </View>
          <View className="flex-row ml-2" style={{ gap: 4 }}>
            <Pressable
              onPress={() =>
                onSelectClue((activeClue - 1 + grid.clues.length) % grid.clues.length)
              }
              className="w-7 h-7 rounded-full bg-overlay items-center justify-center"
            >
              <ArrowLeft size={13} color="#9ca3af" />
            </Pressable>
            <Pressable
              onPress={() => onSelectClue((activeClue + 1) % grid.clues.length)}
              className="w-7 h-7 rounded-full bg-overlay items-center justify-center"
            >
              <ArrowRight size={13} color="#9ca3af" />
            </Pressable>
          </View>
        </View>
      )}

      <LetterTray
        disabled={!activeCell}
        isDark={isDark}
        onType={type}
        preferred={
          activeCell ? grid.cells[activeCell.row][activeCell.col].solution : null
        }
      />

      <ClueList
        clues={grid.clues}
        solvedIds={grade.solvedClues}
        reference={reference}
        accent={accent}
        activeIndex={activeClue}
        onSelect={onSelectClue}
      />

      <PuzzleFooter
        label={`${grade.correctCells}/${grade.totalCells} letters restored`}
        progress={grade.progress}
        hintsLeft={hintsLeft}
        hintText={hintText}
        onHint={onHint}
        accent={accent}
      />
    </View>
  );
}
