/**
 * SceneHeader + SpeechBubble — the two presentational halves of the level
 * cut-scene. Split out of DialogueSheet so the sheet itself stays readable.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";

import type { Character } from "@/data/story";

/* ------------------------------- SceneHeader ------------------------------ */

export default function SceneHeader({
  title,
  setting,
  chapterTitle,
  chapterIndex,
}: {
  title: string;
  setting: string;
  chapterTitle?: string;
  chapterIndex?: number;
}) {
  return (
    <View className="mb-4">
      <Text className="text-quaternary text-[9px] font-sora-bold tracking-widest">
        {chapterTitle
          ? `CHAPTER ${chapterIndex} · ${chapterTitle.toUpperCase()}`
          : "ZOE'S JOURNEY"}
      </Text>
      <Text className="text-primary text-[19px] font-sora-semibold mt-1">
        {title}
      </Text>
      <Text className="text-tertiary text-[11px] font-sora mt-1 italic">
        {setting}
      </Text>
    </View>
  );
}

/* ------------------------------- SpeechBubble ----------------------------- */

/**
 * One line of dialogue: speaker identity on top, the (possibly still typing)
 * line beneath, and a tap target that covers the whole card so advancing never
 * requires hitting a small button.
 */
export function SpeechBubble({
  speaker,
  beat,
  total,
  emotion,
  typed,
  doneTyping,
  accent,
  onPress,
}: {
  speaker: Character;
  beat: number;
  total: number;
  emotion: string;
  typed: string;
  doneTyping: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Animated.View
        entering={FadeInDown.springify().damping(18)}
        exiting={FadeOut.duration(120)}
        className="rounded-3xl p-4 border"
        style={{
          backgroundColor: speaker.tint + "14",
          borderColor: speaker.tint + "33",
          minHeight: 180,
        }}
      >
        <View className="flex-row items-center mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-2.5"
            style={{ backgroundColor: speaker.tint + "2E" }}
          >
            <Text style={{ fontSize: 19 }}>{speaker.emoji}</Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text
              numberOfLines={1}
              className="text-[13px] font-sora-semibold"
              style={{ color: speaker.tint }}
            >
              {speaker.name}
            </Text>
            <Text className="text-quaternary text-[10px] font-sora capitalize">
              {emotion}
            </Text>
          </View>
          <Text className="text-quaternary text-[10px] font-sora tabular-nums">
            {beat}/{total}
          </Text>
        </View>

        <Text className="text-primary text-[15px] font-sora leading-6">
          {typed}
          {!doneTyping && <Text style={{ color: accent }}>▌</Text>}
        </Text>
      </Animated.View>

      <Text className="text-quaternary text-[10px] font-sora text-center mt-3">
        Tap to {doneTyping ? "continue" : "skip"} ▸
      </Text>
    </Pressable>
  );
}
