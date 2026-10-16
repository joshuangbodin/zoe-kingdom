/**
 * Puzzle body components — one per puzzle kind.
 *
 * Every body is a controlled view: it receives the session, reports edits back
 * up, and never touches persistence itself. That keeps all game logic in
 * `libs/puzzles` (and unit-testable) while these files own only interaction and
 * presentation.
 *
 * Shared feedback language ("WOW!", "AWESOME!", the streak pop) lives in
 * `game.json -> feedback`, so the tone of the whole game is data, not code.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lightbulb } from "lucide-react-native";

/* -------------------------------- Shared bits ----------------------------- */

export const CARD = (isDark: boolean) => (isDark ? "#1c1a1a" : "#fbf6ee");

/** The mission line shown above every puzzle. */
export function MissionLine({ text, accent }: { text: string; accent: string }) {
  return (
    <View
      className="rounded-2xl px-3.5 py-3 mb-4 border-l-[3px]"
      style={{ backgroundColor: accent + "12", borderLeftColor: accent }}
    >
      <Text className="text-primary text-[13px] font-sora-medium leading-5">
        {text}
      </Text>
    </View>
  );
}

/** Progress + hint affordance shared by every body. */
export function PuzzleFooter({
  label,
  progress,
  hintsLeft,
  hintText,
  onHint,
  accent,
}: {
  label: string;
  progress: number;
  hintsLeft: number;
  hintText: string | null;
  onHint: () => void;
  accent: string;
}) {
  const pct = Math.round(Math.min(progress, 1) * 100);
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-tertiary text-[11px] font-sora-medium">{label}</Text>
        <Text
          className="text-[11px] font-sora-bold tabular-nums"
          style={{ color: accent }}
        >
          {pct}%
        </Text>
      </View>

      <View className="h-2 bg-overlay rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </View>

      {hintText ? (
        <View className="flex-row items-start mt-3 rounded-2xl px-3 py-2.5 bg-overlay">
          <Lightbulb size={12} color="#fbbf24" style={{ marginTop: 2 }} />
          <Text className="text-secondary text-[11px] font-sora flex-1 ml-2 leading-4">
            {hintText}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={onHint}
          disabled={hintsLeft <= 0}
          className="flex-row items-center justify-center mt-3 py-2.5 rounded-xl bg-overlay"
          style={{ opacity: hintsLeft <= 0 ? 0.4 : 1 }}
        >
          <Lightbulb size={12} color="#fbbf24" />
          <Text className="text-secondary text-[11px] font-sora-semibold ml-1.5">
            {hintsLeft > 0 ? `Hint (${hintsLeft} left)` : "No hints left"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** A tap target that scales down while pressed — the core game feel. */
export function GameChip({
  label,
  onPress,
  active,
  disabled,
  accent,
  isDark,
  small,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  accent: string;
  isDark: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="rounded-xl items-center justify-center"
      style={{
        paddingHorizontal: small ? 10 : 16,
        paddingVertical: small ? 7 : 12,
        backgroundColor: active ? accent : CARD(isDark),
        borderWidth: active ? 0 : 1.5,
        borderColor: active ? accent : "rgba(150,150,150,0.28)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text
        className={`font-sora-semibold ${small ? "text-[12px]" : "text-[14px]"}`}
        style={{ color: active ? "#fff" : undefined }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
