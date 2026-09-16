import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/context/theme-context";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

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

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 180,
  mass: 0.7,
};

/**
 * Slim, minimal segmented control that crowns the arena.
 */
export default memo(function ArenaHeader({
  section,
  onSectionChange,
  rightMeta,
}: Props) {
  const { isDark } = useTheme();

  return (
    <View className="mb-3 pt-3">
      <View className="flex-row rounded-full">
        {SEGMENTS.map((seg) => {
          const active = section === seg.id;

          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [
                {
                  scale: withSpring(active ? 1 : 0.9, SPRING_CONFIG),
                },
              ],
              opacity: withSpring(active ? 1 : 0.25, SPRING_CONFIG),
            };
          }, [active]);

          return (
            <Pressable
              key={seg.id}
              onPress={() => onSectionChange(seg.id)}
              className="pr-5"
            >
              <Animated.Text
                className="text-lg text-primary  font-sora-semibold"
                style={[
                  // {
                  //   color: active
                  //     ? isDark?"#000":"#fff"
                  //     : isDark
                  //       ? "#a1a1aa"
                  //       : "#71717a",
                  // },
                  animatedStyle,
                ]}
              >
                {seg.label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>

      {/* <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-secondary text-[11px] font-sora-semibold uppercase tracking-wider">
          {section === "challenges" ? "Weekly Challenges" : "Top Players"}
        </Text>

        <Text className="text-quaternary text-[9px] font-sora-medium">
          {rightMeta}
        </Text>
      </View> */}
    </View>
  );
});