
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import type { Character } from "@/data/story";

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
    <View className="mb-5">
      <Text className="text-quaternary text-xs font-sora">
        {chapterTitle
          ? `Chapter ${chapterIndex} · ${chapterTitle}`
          : "ZOE'S JOURNEY"}
      </Text>

      <Text className="text-primary text-[19px] font-sora-semibold mt-1">
        {title}
      </Text>

      <Text className="text-tertiary text-xs font-sora mt-3 italic">
        {setting}
      </Text>
    </View>
  );
}

type SpeechBubbleProps = {
  speaker: Character;
  beat: number;
  total: number;
  emotion: string;
  text: string;
  revealedChars: number;
  doneTyping: boolean;
  accent: string;
  onPrimaryPress: () => void;
  onSkipStory: () => void;
};

export function SpeechBubble({
  speaker,
  beat,
  total,
  emotion,
  text,
  revealedChars,
  doneTyping,
  accent,
  onPrimaryPress,
  onSkipStory,
}: SpeechBubbleProps) {
  const { isDark } = useTheme();

  const vividColor = isDark ? "#F5F5F1" : "#292D28";

  const mutedColor = isDark
    ? "rgba(245,245,241,0.28)"
    : "rgba(41,45,40,0.28)";

  const characters = Array.from(text);

  return (
    <View>
      <View
        className="rounded-3xl p-4 "
        style={{
          backgroundColor: speaker.tint + "20",
      
          minHeight: 180,
        }}
      >
        {/* Speaker */}
        <View className="flex-row items-center mb-4">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-2.5"
            style={{
              backgroundColor: speaker.tint + "2E",
            }}
          >
            <Text style={{ fontSize: 19 }}>
              {speaker.emoji}
            </Text>
          </View>

          <View className="flex-1 min-w-0">
            <Text
              numberOfLines={1}
              className="text-[13px] font-sora-semibold"
              style={{ color: speaker.tint }}
            >
              {speaker.name}
            </Text>

            <Text className="text-primary/80 text-[10px] font-sora capitalize">
              {emotion}
            </Text>
          </View>

          <Text className="text-primary/80 text-[10px] font-sora tabular-nums">
            {beat}/{total}
          </Text>
        </View>

        {/* Dialogue text: all characters remain visible */}
        <Text
          accessibilityLabel={text}
          className="text-[15px] font-sora leading-6"
        >
          {characters.map((character, index) => (
            <Text
              key={index}
              style={{
                color:
                  index < revealedChars
                    ? vividColor
                    : mutedColor,
              }}
            >
              {character}
            </Text>
          ))}
        </Text>
      </View>

      {/* Explicit dialogue controls */}
      <View className="flex-row items-center justify-between mt-4">
        <Pressable
          onPress={onPrimaryPress}
          accessibilityRole="button"
          accessibilityLabel={
            doneTyping ? "Continue dialogue" : "Reveal complete line"
          }
          className="flex-row items-center justify-center rounded-full px-5 py-3"
          style={{
            backgroundColor: speaker.tint,
            
            minWidth: 130,
          }}
        >
          <Text
            className="text-[11px] font-sora-semibold"
            style={{ color: "#fff" }}
          >
            {doneTyping ? "Continue" : "Tap to skip"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onSkipStory}
          accessibilityRole="button"
          accessibilityLabel="Skip the remaining story"
          hitSlop={8}
          className="px-3 py-3"
        >
          <Text className="text-tertiary text-[11px] font-sora-medium">
            Skip story
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
