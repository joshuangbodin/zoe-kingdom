/**
 * ClueList — the numbered across/down list beside the grid.
 *
 * Solved clues are struck through and ticked, which gives the player a second
 * progress readout alongside the percentage bar and makes it obvious which
 * threads are still loose.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import type { CrosswordClue } from "@/libs/puzzles/crossword";

type Props = {
  clues: CrosswordClue[];
  solvedIds: number[];
  reference: string;
  accent: string;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export default function ClueList({
  clues,
  solvedIds,
  reference,
  accent,
  activeIndex,
  onSelect,
}: Props) {
  return (
    <View className="mt-3">
      <Text className="text-quaternary text-[9px] font-sora-bold tracking-widest mb-1">
        ALL CLUES · {reference}
      </Text>

      {clues.map((c, i) => {
        const solved = solvedIds.includes(c.id);
        const active = i === activeIndex;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(i)}
            className="flex-row items-center py-1.5 rounded-lg px-1"
            style={{ backgroundColor: active ? accent + "12" : "transparent" }}
          >
            <Text
              className="text-[11px] font-sora-bold w-12 tabular-nums"
              style={{ color: solved ? accent : undefined }}
            >
              {c.number} {c.dir === "across" ? "→" : "↓"}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-[11px] font-sora flex-1 ${
                solved ? "text-tertiary line-through" : "text-secondary"
              }`}
            >
              {c.clue}
            </Text>
            {solved && <Check size={11} color={accent} strokeWidth={3} />}
          </Pressable>
        );
      })}
    </View>
  );
}
