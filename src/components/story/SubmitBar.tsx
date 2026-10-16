/**
 * SubmitBar — the finish button under every puzzle.
 *
 * It stays disabled until the puzzle is genuinely complete, so a player can
 * never spend energy on a wrong answer: the 2-energy cost lands only when the
 * verse is actually restored. The energy cost is printed on the button so the
 * economy is never a surprise.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { Zap } from "lucide-react-native";

type Props = {
  complete: boolean;
  accent: string;
  cost: number;
  onSubmit: () => void;
  /** Overrides the enabled label (choice puzzles read differently). */
  label?: string;
};

export default function SubmitBar({
  complete,
  accent,
  cost,
  onSubmit,
  label,
}: Props) {
  const text = complete
    ? (label ?? "RESTORE THE VERSE")
    : "KEEP GOING…";

  return (
    <Pressable
      onPress={onSubmit}
      disabled={!complete}
      className="rounded-2xl py-4 mt-5 flex-row items-center justify-center"
      style={{
        backgroundColor: complete ? accent : "rgba(150,150,150,0.2)",
        opacity: complete ? 1 : 0.75,
      }}
    >
      <Text
        className="text-[14px] font-sora-bold tracking-widest"
        style={{ color: complete ? "#fff" : undefined }}
      >
        {text}
      </Text>

      {complete && (
        <View className="flex-row items-center ml-2.5">
          <Zap size={12} color="#fff" fill="#fff" />
          <Text className="text-white text-[12px] font-sora-bold ml-1 tabular-nums">
            {cost}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
