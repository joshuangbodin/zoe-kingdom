
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lightbulb } from "lucide-react-native";

/* -------------------------------- Shared bits ----------------------------- */

export const CARD = (isDark: boolean) => (isDark ? "#1c1a1a" : "#fbf6ee");

/** Compact mission heading shown above every puzzle. */
export function MissionLine({
  text,
  accent,
}: {
  text: string;
  accent: string;
}) {
  return (
    <View style={{ backgroundColor: accent + "50" }} className="mb-5 p-3 rounded-xl">
      

      <Text className="text-primary text-[15px] font-sora-semibold leading-6">
        {text}
      </Text>
    </View>
  );
}

/** Subtle progress indicator and hint action shared by every puzzle. */
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
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <View className="mt-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-[11px] font-sora-medium">
          {label}
        </Text>

        <Text
          className="text-[11px] font-sora-bold tabular-nums"
          style={{ color: accent }}
        >
          {pct}%
        </Text>
      </View>

      <View className="h-1 bg-overlay rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: accent,
          }}
        />
      </View>

      {hintText ? (
        <View className="flex-row items-start mt-4">
          <Lightbulb
            size={14}
            color={accent}
            style={{ marginTop: 2 }}
          />

          <Text className="text-secondary text-[12px] font-sora ml-2 flex-1 leading-5">
            {hintText}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={onHint}
          disabled={hintsLeft <= 0}
          accessibilityRole="button"
          accessibilityLabel={
            hintsLeft > 0
              ? `Use a hint. ${hintsLeft} remaining`
              : "No hints remaining"
          }
          className="flex-row items-center self-start mt-3 py-1"
          style={{ opacity: hintsLeft <= 0 ? 0.4 : 1 }}
        >
          <Lightbulb size={13} color={accent} />

          <Text
            className="text-[11px] font-sora-semibold ml-1.5"
            style={{ color: accent }}
          >
            {hintsLeft > 0 ? `Get a hint · ${hintsLeft} left` : "No hints left"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** Tactile answer chip used throughout the puzzle bodies. */
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
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      style={({ pressed }) => ({
        minHeight: small ? 34 : 46,
        paddingHorizontal: small ? 11 : 16,
        paddingVertical: small ? 7 : 11,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active
          ? accent
          : isDark
            ? "#1c1a1a"
            : "#fbf6ee",
        borderWidth: active ? 1 : 1,
        borderColor: active
          ? accent
          : isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(55,65,52,0.12)",
        opacity: disabled ? 0.38 : pressed ? 0.76 : 1,
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
      })}
    >
      <Text
        className={`font-sora-semibold ${
          small ? "text-[12px]" : "text-[14px]"
        }`}
        style={{
          color: active
            ? "#ffffff"
            : isDark
              ? "#f5f5f5"
              : "#292d28",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
