/**
 * MissionBrief — the card that ends every level cut-scene.
 *
 * It states, in the player's own terms, WHAT they have been asked to do, WHAT
 * puzzle they will face, and WHAT it will cost/reward. Then a single BEGIN
 * button hands over to the puzzle. This is what makes the story feel like a
 * quest rather than a quiz.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Zap } from "lucide-react-native";

import {
  CHARACTERS,
  getCharacter,
  type DialogueBeat,
  type SpeakerId,
  type StoryLevel,
} from "@/data/story";

/** Human-readable puzzle name for the brief. */
export const puzzleLabel = (kind: string): string =>
  ({
    blanks: "Complete the Verses",
    choice: "Choose the Response",
    order: "Rebuild the Promise",
    crossword: "Crossword Lattice",
    wordsearch: "Word Hunt",
  })[kind] ?? kind;

/** Distinct speakers in first-appearance order. */
const castOf = (dialogue: DialogueBeat[]): SpeakerId[] => {
  const seen: SpeakerId[] = [];
  dialogue.forEach((d) => {
    if (!seen.includes(d.who) && CHARACTERS[d.who]) seen.push(d.who);
  });
  return seen;
};

export default function MissionBrief({
  level,
  accent,
  dialogue,
  onBegin,
}: {
  level: StoryLevel;
  accent: string;
  dialogue: DialogueBeat[];
  onBegin: (level: StoryLevel) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <View
        className="rounded-3xl p-4 mb-4 border"
        style={{ backgroundColor: accent + "14", borderColor: accent + "44" }}
      >
        <Text
          className="text-[10px] font-sora-bold tracking-widest mb-2"
          style={{ color: accent }}
        >
          YOUR MISSION
        </Text>
        <Text className="text-primary text-[16px] font-sora-semibold leading-6">
          {level.mission}
        </Text>

        <View className="flex-row items-center mt-3.5 pt-3.5 border-t border-line">
          <View className="flex-row items-center flex-1">
            <Zap size={11} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-amber-500 text-[11px] font-sora-bold ml-1">
              {level.cost}
            </Text>
          </View>
          <Text className="text-tertiary text-[11px] font-sora-medium flex-1 text-center">
            {puzzleLabel(level.puzzle.kind)}
          </Text>
          <Text className="text-emerald-400 text-[11px] font-sora-bold flex-1 text-right">
            +{level.reward} XP
          </Text>
        </View>
      </View>

      {/* Who you'll meet — reinforces the cast without another read-through */}
      <View className="mb-5">
        <Text className="text-quaternary text-[9px] font-sora-bold tracking-widest mb-2">
          IN THIS SCENE
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: 6 }}>
          {castOf(dialogue).map((id) => (
            <View
              key={id}
              className="flex-row items-center rounded-full pl-1 pr-2.5 py-1"
              style={{ backgroundColor: getCharacter(id).tint + "1F" }}
            >
              <Text style={{ fontSize: 13 }}>{getCharacter(id).emoji}</Text>
              <Text className="text-secondary text-[10px] font-sora-medium ml-1.5">
                {getCharacter(id).name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => onBegin(level)}
        className="rounded-2xl py-4 items-center"
        style={{ backgroundColor: accent }}
      >
        <Text className="text-[15px] font-sora-bold text-white tracking-widest">
          BEGIN ▸
        </Text>
      </Pressable>

      <Text className="text-quaternary text-[10px] font-sora text-center mt-3">
        {level.cost} energy will be spent when you finish the puzzle.
      </Text>
    </Animated.View>
  );
}
