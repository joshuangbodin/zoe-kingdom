/**
 * VerseSlot — one blank inside a restored verse.
 *
 * Correct placements turn gold with a check; the next empty slot carries a
 * brighter outline so the eye always knows where the next word goes.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check } from "lucide-react-native";

import { wordsMatch } from "@/libs/puzzles/blanks";

export default function VerseSlot({
  filled,
  answer,
  isNext,
  accent,
  isDark,
  onPress,
}: {
  filled: string | null;
  answer: string;
  isNext: boolean;
  accent: string;
  isDark: boolean;
  onPress?: () => void;
}) {
  const correct = filled !== null && wordsMatch(filled, answer);

  return (
    <Animated.View entering={FadeIn.duration(180)}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="mx-1 my-0.5 rounded-xl flex-row items-center justify-center"
        style={{
          minWidth: 76,
          paddingHorizontal: 10,
          height: 34,
          backgroundColor: correct
            ? accent + "33"
            : filled
              ? "rgba(239,68,68,0.18)"
              : isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
          borderWidth: 1.5,
          borderColor: correct
            ? accent
            : filled
              ? "rgba(239,68,68,0.6)"
              : isNext
                ? accent + "99"
                : "rgba(150,150,150,0.3)",
        }}
      >
        {filled ? (
          <View className="flex-row items-center">
            <Text
              className="text-[14px] font-sora-semibold mr-1"
              style={{ color: correct ? accent : "#ef4444" }}
            >
              {filled}
            </Text>
            {correct && <Check size={12} color={accent} strokeWidth={3} />}
          </View>
        ) : (
          <Text className="text-quaternary text-[13px] font-sora">____</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
