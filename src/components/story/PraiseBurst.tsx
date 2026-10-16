/**
 * PraiseBurst — imperative, so any puzzle body can fire a praise pop without
 * owning animation state. Attach a ref and call `praise(streak?)`.
 *
 * Copy comes from `game.json -> feedback` (praise / streakPraise), so the tone of
 * every "WOW!" in the game is data, not code.
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { FEEDBACK } from "@/data/story";

export type PraiseBurstHandle = {
  /** Fire a praise pop. `streak` renders the bigger gold variant. */
  praise: (streak?: boolean) => void;
};

type Props = {
  accent?: string;
};

type Active = { id: number; text: string; streak: boolean };

const PraiseBurst = forwardRef<PraiseBurstHandle, Props>(function PraiseBurst(
  { accent = "#fbbf24" },
  ref,
) {
  const [active, setActive] = useState<Active | null>(null);
  const idRef = useRef(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useImperativeHandle(
    ref,
    () => ({
      praise: (streak = false) => {
        const id = ++idRef.current;
        const pool = streak
          ? (FEEDBACK.streakPraise as string[])
          : (FEEDBACK.praise as string[]);
        setActive({ id, text: pool[id % pool.length], streak });

        // Restart from a small scale each time so back-to-back pops still read.
        scale.value = 0.4;
        opacity.value = 0;
        scale.value = withSequence(
          withSpring(1, { damping: 8, stiffness: 220, mass: 0.6 }),
          withTiming(1.06, { duration: 260 }),
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withTiming(1, { duration: 520 }),
          withTiming(0, { duration: 320 }),
        );
      },
    }),
    [],
  );

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: "-4deg" }],
  }));

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", alignSelf: "center", top: "38%", zIndex: 60 },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: active.streak ? 34 : 26,
          fontWeight: "900",
          letterSpacing: 1,
          color: active.streak ? accent : "#ffffff",
          textShadowColor: "rgba(0,0,0,0.55)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        }}
      >
        {active.text}
      </Text>
    </Animated.View>
  );
});

export default PraiseBurst;
