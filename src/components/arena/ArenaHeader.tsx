import React, { memo } from "react";
import { Pressable, View } from "react-native";
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

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
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
    <Pressable onPress={onPress} className="pr-5">
      <Animated.Text
        className="text-lg text-primary font-sora-semibold"
        style={[animatedStyle]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

/**
 * Slim, minimal segmented control that crowns the arena.
 */
export default memo(function ArenaHeader({
  section,
  onSectionChange,
  rightMeta,
}: Props) {
  return (
    <View className="mb-3 pt-3">
      <View className="flex-row rounded-full">
        {SEGMENTS.map((seg) => (
          <Segment
            key={seg.id}
            label={seg.label}
            active={section === seg.id}
            onPress={() => onSectionChange(seg.id)}
          />
        ))}
      </View>
    </View>
  );
});