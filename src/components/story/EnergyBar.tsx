import React, { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Zap } from "lucide-react-native";

import { COST_PER_LEVEL, MAX_ENERGY } from "@/libs/sqlite/story";

type Props = {
  energy: number;
  maxEnergy?: number;
  /** Shown under the meter; omitted on tight layouts. */
  caption?: boolean;
  /** Where tapping the meter takes the player (usually the habits tab). */
  onPress?: () => void;
};

/**
 * The energy meter — the single most important status readout in the game.
 *
 * Energy is earned by completing real habits and spent 2 at a time per level, so
 * we render it as discrete PIPS (one pip = one level of play) rather than a
 * continuous bar. That makes "I can play three more levels" legible at a glance,
 * and it turns a habit completion into a visibly satisfying pip refill.
 */
export default function EnergyBar({
  energy,
  maxEnergy = MAX_ENERGY,
  caption = true,
  onPress,
}: Props) {
  const pips = Math.floor(maxEnergy / COST_PER_LEVEL);
  const filled = Math.floor(energy / COST_PER_LEVEL);

  // Pulse the counter whenever the balance grows, so habit completions read as
  // an event rather than a silent number change.
  const bump = useSharedValue(1);
  const prev = useRef(energy);
  useEffect(() => {
    if (energy > prev.current) {
      bump.value = withSequence(
        withSpring(1.22, { damping: 6, stiffness: 260 }),
        withSpring(1, { damping: 9, stiffness: 180 }),
      );
    }
    prev.current = energy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energy]);

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));

  const low = energy < COST_PER_LEVEL;

  const body = (
    <View className="bg-card-1 rounded-3xl p-3.5 mb-4 border border-line">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-full bg-amber-500/15 items-center justify-center mr-2">
            <Zap size={14} color="#f59e0b" fill={low ? "transparent" : "#f59e0b"} />
          </View>
          <Text className="text-primary text-[13px] font-sora-semibold">
            Energy
          </Text>
        </View>

        <Animated.Text
          className="text-secondary text-[12px] font-sora-semibold tabular-nums"
          style={counterStyle}
        >
          {energy}
          <Text className="text-tertiary text-[11px] font-sora">
            {" "}
            / {maxEnergy}
          </Text>
        </Animated.Text>
      </View>

      {/* Pips: one per level of play available */}
      <View className="flex-row items-center" style={{ gap: 3 }}>
        {Array.from({ length: pips }).map((_, i) => (
          <Pip key={i} on={i < filled} />
        ))}
      </View>

      {caption && (
        <Text className="text-tertiary text-[10px] font-sora mt-2.5">
          {low
            ? "Out of energy — complete a habit to earn more."
            : `Each level costs ${COST_PER_LEVEL} energy. You can play ${filled} more.`}
        </Text>
      )}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

/** One pip = one level of play. */
function Pip({ on }: { on: boolean }) {
  const grow = useSharedValue(on ? 1 : 0.35);

  useEffect(() => {
    grow.value = withTiming(on ? 1 : 0.35, { duration: 260 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const style = useAnimatedStyle(() => ({
    opacity: grow.value,
    transform: [{ scaleY: 0.55 + grow.value * 0.45 }],
  }));

  return (
    <Animated.View
      className="flex-1 rounded-full"
      style={[
        { height: 7, backgroundColor: on ? "#f59e0b" : "rgba(245,158,11,0.18)" },
        style,
      ]}
    />
  );
}
