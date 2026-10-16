/**
 * CrosswordGrid — the letter grid itself.
 *
 * Cells with no solution render as transparent gaps (the classic crossword
 * silhouette). Cells in the active clue are tinted, and correctly-typed letters
 * render in the accent colour so the restored verse visibly emerges.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";

import type {
  CrosswordGrid as Grid,
  CrosswordState,
} from "@/libs/puzzles/crossword";

type Props = {
  grid: Grid;
  state: CrosswordState;
  activeCells: Set<string>;
  cellSize: number;
  accent: string;
  isDark: boolean;
  onCellPress: (row: number, col: number) => void;
};

export default function CrosswordGrid({
  grid,
  state,
  activeCells,
  cellSize,
  accent,
  isDark,
  onCellPress,
}: Props) {
  return (
    <View
      className="rounded-3xl p-3 mb-3 self-center"
      style={{ backgroundColor: isDark ? "#1c1a1a" : "#fbf6ee" }}
    >
      {grid.cells.map((row, r) => (
        <View key={r} className="flex-row">
          {row.map((cell, c) => {
            const key = `${r},${c}`;

            // Blocked cells are simply absent — that is the crossword silhouette.
            if (!cell.solution) {
              return <View key={key} style={{ width: cellSize, height: cellSize }} />;
            }

            const typed = state.entries[r]?.[c] ?? "";
            const isRight = typed === cell.solution;
            const isActive = activeCells.has(key);
            const number = cell.starts.length > 0 ? cell.starts[0] : null;

            return (
              <Pressable
                key={key}
                onPress={() => onCellPress(r, c)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isActive
                    ? accent + "26"
                    : isRight
                      ? accent + "1A"
                      : "transparent",
                }}
                className="items-center justify-center border border-line"
              >
                {number !== null && (
                  <Text
                    className="absolute text-quaternary font-sora-bold"
                    style={{ top: 0, left: 2, fontSize: 7 }}
                  >
                    {number}
                  </Text>
                )}
                <Text
                  className="font-sora-bold"
                  style={{
                    fontSize: isRight ? 13 : 12,
                    color: isRight ? accent : isDark ? "#e5e5e5" : "#1c1a1a",
                  }}
                >
                  {typed}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
