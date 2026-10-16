/**
 * WordGrid + WordChecklist — the two halves of the word-hunt presentation.
 */

import React from "react";
import { Text, View } from "react-native";
import { Check } from "lucide-react-native";

type GridProps = {
  grid: string[][];
  /** Cells covered by words already found ("row,col"). */
  foundCells: Set<string>;
  dragCells: Set<string>;
  cellSize: number;
  accent: string;
  isDark: boolean;
  onLayout: (pageX: number, pageY: number) => void;
  panHandlers: object;
};

/** The letter grid plus the pan surface that drives selection. */
export default function WordGrid({
  grid,
  foundCells,
  dragCells,
  cellSize,
  accent,
  isDark,
  onLayout,
  panHandlers,
}: GridProps) {
  return (
    <View
      className="rounded-3xl p-3 mb-3 self-center"
      style={{ backgroundColor: isDark ? "#1c1a1a" : "#fbf6ee" }}
      onLayout={(e) => {
        // Measure in page coordinates to match the pan handler's pageX/pageY.
        const node = e.target as unknown as {
          measure?: (
            cb: (
              x: number,
              y: number,
              w: number,
              h: number,
              pageX: number,
              pageY: number,
            ) => void,
          ) => void;
        };
        node?.measure?.((_x, _y, _w, _h, pageX, pageY) => {
          onLayout(pageX, pageY);
        });
      }}
      {...panHandlers}
    >
      {grid.map((row, r) => (
        <View key={r} className="flex-row">
          {row.map((letter, c) => {
            const key = `${r},${c}`;
            const isFound = foundCells.has(key);
            const isDrag = dragCells.has(key);
            return (
              <View
                key={key}
                className="items-center justify-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isFound
                    ? accent + "3A"
                    : isDrag
                      ? accent + "26"
                      : "transparent",
                  borderRadius: 6,
                }}
              >
                <Text
                  className="font-sora-semibold"
                  style={{
                    fontSize: 13,
                    color:
                      isFound || isDrag ? accent : isDark ? "#e5e5e5" : "#3f372d",
                  }}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------- Checklist -------------------------------- */

export function WordChecklist({
  words,
  found,
  reference,
  accent,
}: {
  words: string[];
  found: string[];
  reference: string;
  accent: string;
}) {
  return (
    <View>
      <Text className="text-quaternary text-[9px] font-sora-bold tracking-widest mb-2">
        FIND THE WORDS · {reference}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 7 }}>
        {words.map((word) => {
          const isFound = found.includes(word.toUpperCase());
          return (
            <View
              key={word}
              className="flex-row items-center rounded-full px-2.5 py-1.5"
              style={{
                backgroundColor: isFound ? accent + "26" : "transparent",
                borderWidth: 1.5,
                borderColor: isFound ? accent : "rgba(150,150,150,0.3)",
              }}
            >
              {isFound && <Check size={10} color={accent} strokeWidth={3} />}
              <Text
                className={`text-[11px] font-sora-semibold ${
                  isFound ? "line-through ml-1 text-tertiary" : "text-secondary"
                }`}
              >
                {word}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
