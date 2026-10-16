/**
 * Confetti / ember burst used by the victory overlay.
 *
 * Pieces are generated once per burst from a seeded RNG so a celebration looks
 * organic but is stable across re-renders (and cheap — no per-frame allocation).
 * Everything animates on the UI thread via Reanimated so a 40-piece burst stays
 * at 60fps even while the sheet is still animating in.
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { createRng } from "@/libs/puzzles/rng";

type Piece = {
  x: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
  color: string;
  round: boolean;
};

type Props = {
  /** Changing this value retriggers the burst. */
  burstKey: number;
  count?: number;
  colors?: string[];
  width?: number;
  height?: number;
};

const DEFAULT_COLORS = [
  "#fbbf24",
  "#f59e0b",
  "#22c55e",
  "#38bdf8",
  "#a855f7",
  "#f472b6",
];

function PieceView({ piece, height }: { piece: Piece; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.linear }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.75 ? 1 : (1 - progress.value) / 0.25,
    transform: [
      { translateY: -progress.value * height * 0.85 },
      { translateX: piece.drift * progress.value },
      { rotate: `${piece.spin * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          left: `${piece.x}%`,
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 2.1,
          backgroundColor: piece.color,
          borderRadius: piece.round ? piece.size / 2 : 1,
        },
        style,
      ]}
    />
  );
}

/**
 * A one-shot celebratory burst. Mount it, bump `burstKey`, and pieces fall from
 * the top of the container.
 */
export default function Confetti({
  burstKey,
  count = 36,
  colors = DEFAULT_COLORS,
  width = 320,
  height = 420,
}: Props) {
  const pieces = useMemo<Piece[]>(() => {
    const rng = createRng(`confetti-${burstKey}`);
    return Array.from({ length: count }, () => ({
      x: rng.next() * 100,
      delay: rng.int(420),
      duration: 1100 + rng.int(700),
      drift: (rng.next() - 0.5) * 140,
      spin: (rng.next() - 0.5) * 900,
      size: 5 + rng.int(6),
      color: colors[rng.int(colors.length)],
      round: rng.next() > 0.6,
    }));
    // Pieces are intentionally regenerated only when the burst changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey, count]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { width, height, overflow: "hidden" }]}
    >
      {pieces.map((p, i) => (
        <PieceView key={`${burstKey}-${i}`} piece={p} height={height} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    top: -12,
  },
});
