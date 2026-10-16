/**
 * StarRow — the 1-3 star rating shown on solved levels and in the victory card.
 *
 * Earned stars fill and pop in one at a time (staggered), which is what makes
 * the reward land. Unearned stars stay as hollow outlines so the player can see
 * what a better replay would buy them.
 */

import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { Star } from "lucide-react-native";

type Props = {
  stars: number;
  size?: number;
  color?: string;
  /** Stagger delay between stars, ms. */
  stagger?: number;
  /** Animate the fill on mount (used in the victory card). */
  animate?: boolean;
};

function StarDot({
  filled,
  size,
  color,
  delay,
  animate,
}: {
  filled: boolean;
  size: number;
  color: string;
  delay: number;
  animate: boolean;
}) {
  const pop = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      pop.value = withDelay(delay, withSpring(1, { damping: 7, stiffness: 200 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.5 + pop.value * 0.5 }],
  }));

  return (
    <Animated.View style={animate ? style : undefined}>
      <Star
        size={size}
        color={filled ? color : "rgba(150,150,150,0.45)"}
        fill={filled ? color : "transparent"}
        strokeWidth={2.2}
      />
    </Animated.View>
  );
}

export default function StarRow({
  stars,
  size = 13,
  color = "#fbbf24",
  stagger = 160,
  animate = false,
}: Props) {
  return (
    <View className="flex-row items-center" style={{ gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <StarDot
          key={i}
          filled={i < stars}
          size={size}
          color={color}
          delay={i * stagger}
          animate={animate}
        />
      ))}
    </View>
  );
}
