/**
 * WordSearchBody — the "Word Hunt" puzzle.
 *
 * The player drags across letters to select a straight run. Selection uses a
 * PanResponder over the whole grid: we map the touch position back to a cell from
 * the measured grid origin, then hand the from/to pair to `cellsForSelection`,
 * which snaps a sloppy drag onto the nearest of the eight directions. Found words
 * stay highlighted and get struck off the list, and each find fires a praise pop
 * — the most satisfying feedback loop in the game.
 */

import React, { useMemo, useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import type { WordSearchSession } from "@/libs/puzzles";
import { cellsForSelection, selectionWord } from "@/libs/puzzles/wordsearch";

import { CARD, MissionLine, PuzzleFooter } from "./PuzzleChrome";
import WordGrid, { WordChecklist } from "./WordGrid";

type Props = {
  session: WordSearchSession;
  mission: string;
  reference: string;
  targetWords: string[];
  accent: string;
  isDark: boolean;
  hintsLeft: number;
  hintText: string | null;
  onHint: () => void;
  /** Fired when a drag spells a word. `found` = it was on the list. */
  onSelect: (
    word: string,
    cells: { row: number; col: number }[],
    found: boolean,
  ) => void;
};

export default function WordSearchBody({
  session,
  mission,
  reference,
  targetWords,
  accent,
  isDark,
  hintsLeft,
  hintText,
  onHint,
  onSelect,
}: Props) {
  const { grid, found } = session;
  const size = grid.size;
  const cellSize = Math.min(32, Math.floor(320 / size));

  // Grid geometry measured at runtime so touch -> cell mapping stays accurate
  // regardless of screen width or the cell size we picked.
  const origin = useRef({ x: 0, y: 0 });
  const dragFrom = useRef<{ row: number; col: number } | null>(null);
  const [dragTo, setDragTo] = useState<{ row: number; col: number } | null>(null);

  const cellAt = (pageX: number, pageY: number) => {
    const col = Math.floor((pageX - origin.current.x) / cellSize);
    const row = Math.floor((pageY - origin.current.y) / cellSize);
    if (row < 0 || col < 0 || row >= size || col >= size) return null;
    return { row, col };
  };

  /** Cells of every found word, for the persistent highlight. */
  const foundCells = useMemo(() => {
    const set = new Set<string>();
    grid.placements
      .filter((p) => found.includes(p.word))
      .forEach((p) => p.cells.forEach((c) => set.add(`${c.row},${c.col}`)));
    return set;
  }, [grid.placements, found]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const cell = cellAt(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        dragFrom.current = cell;
        setDragTo(cell);
      },
      onPanResponderMove: (evt) => {
        if (!dragFrom.current) return;
        setDragTo(cellAt(evt.nativeEvent.pageX, evt.nativeEvent.pageY));
      },
      onPanResponderRelease: () => {
        const from = dragFrom.current;
        if (from && dragTo) {
          const cells = cellsForSelection(from, dragTo);
          if (cells) {
            const word = selectionWord(grid.grid, cells);
            const hit = grid.placements.some(
              (p) => p.word === word && !found.includes(p.word),
            );
            onSelect(word, cells, hit);
          }
        }
        dragFrom.current = null;
        setDragTo(null);
      },
      onPanResponderTerminate: () => {
        dragFrom.current = null;
        setDragTo(null);
      },
    }),
  ).current;

  /** Live highlight for the in-progress drag. */
  const dragCells = useMemo(() => {
    const from = dragFrom.current;
    if (!from || !dragTo) return new Set<string>();
    const cells = cellsForSelection(from, dragTo) ?? [];
    return new Set(cells.map((c) => `${c.row},${c.col}`));
  }, [dragTo, dragCellsNonce(dragTo)]);

  const progress =
    grid.placements.length === 0 ? 1 : found.length / grid.placements.length;
  const words = targetWords.length ? targetWords : grid.placements.map((p) => p.word);

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <WordGrid
        grid={grid.grid}
        foundCells={foundCells}
        dragCells={dragCells}
        cellSize={cellSize}
        accent={accent}
        isDark={isDark}
        onLayout={(pageX: number, pageY: number) => {
          origin.current = { x: pageX + 12, y: pageY + 12 };
        }}
        panHandlers={pan.panHandlers}
      />

      <WordChecklist
        words={words}
        found={found}
        reference={reference}
        accent={accent}
      />

      <PuzzleFooter
        label={`${found.length}/${grid.placements.length} words found`}
        progress={progress}
        hintsLeft={hintsLeft}
        hintText={hintText}
        onHint={onHint}
        accent={accent}
      />
    </View>
  );
}

/** Bumping this forces the drag highlight to recompute as the finger moves. */
const dragCellsNonce = (to: { row: number; col: number } | null) =>
  to ? `${to.row}:${to.col}` : "none";
