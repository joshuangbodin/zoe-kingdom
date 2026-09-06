import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";

export type ArenaSection = "challenges" | "leaderboard";

type Props = {
  section: ArenaSection;
  onSectionChange: (s: ArenaSection) => void;
  rightMeta: string;
};

const SEGMENTS: { id: ArenaSection; label: string }[] = [
  { id: "challenges", label: "Challenges" },
  { id: "leaderboard", label: "Leaderboard" },
];

/**
 * Slim, minimal segmented control that crowns the arena. The heavy
 * section-relative content (podium, etc.) lives in the list below it.
 */
export default memo(function ArenaHeader({
  section,
  onSectionChange,
  rightMeta,
}: Props) {
  const { isDark } = useTheme();

  return (
    <View className="px-4 pt-3">
      <View className="flex-row bg-card-1 rounded-full p-[3px] border border-line">
        {SEGMENTS.map((seg) => {
          const active = section === seg.id;
          return (
            <Pressable
              key={seg.id}
              onPress={() => onSectionChange(seg.id)}
              className="flex-1 py-[7px] rounded-full items-center"
              style={
                active
                  ? isDark
                    ? { backgroundColor: "#27272a" }
                    : { backgroundColor: "#0c0c0c" }
                  : { backgroundColor: "transparent" }
              }
            >
              <Text
                className="text-[11px] font-sora-semibold"
                style={{
                  color: active
                    ? "#fff"
                    : isDark
                      ? "#a1a1aa"
                      : "#71717a",
                }}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center justify-between mt-4">
        <Text className="text-secondary text-[11px] font-sora-semibold uppercase tracking-wider">
          {section === "challenges" ? "Weekly Challenges" : "Top Players"}
        </Text>
        <Text className="text-quaternary text-[9px] font-sora-medium">
          {rightMeta}
        </Text>
      </View>
    </View>
  );
});