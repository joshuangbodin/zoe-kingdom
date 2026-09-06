import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Zap } from "lucide-react-native";

import { useTheme } from "@/context/theme-context";
import type { ChallengeProgress } from "@/libs/sqlite/challenges";

import { iconFor } from "./challengeIcon";

type Props = {
  item: ChallengeProgress;
  claiming: boolean;
  onClaim: () => void;
};

export default function ChallengeCard({ item, claiming, onClaim }: Props) {
  const { isDark } = useTheme();
  const pct =
    item.target > 0 ? Math.min((item.progress / item.target) * 100, 100) : 0;

  return (
    <View className="bg-card-1 rounded-2xl p-3.5 mb-3 border border-line">
      <View className="flex-row items-center">
        {/* Icon tile */}
        <View
          className="h-11 w-11 rounded-[10px] items-center justify-center"
          style={{ backgroundColor: item.color }}
        >
          {iconFor(item.icon, 18, "#fff")}
        </View>

        {/* Title + description */}
        <View className="flex-1 ml-3 min-w-0">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-primary text-[13px] font-sora-semibold"
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-tertiary text-[10px] font-sora mt-[1px]"
          >
            {item.description}
          </Text>
        </View>
      </View>

      {/* Progress bar with reward inline */}
      <View className="flex-row items-center mt-3">
        <View className="relative h-2 flex-1 bg-overlay rounded-full overflow-hidden">
          <View
            style={{
              width: `${pct}%`,
              backgroundColor: claimedColor(item, isDark),
            }}
            className="h-full rounded-full"
          />
        </View>

        {item.claimed ? (
          <View className="ml-2.5 flex-row items-center rounded-full bg-emerald-500/15 px-2 py-1">
            <CheckMini />
            <Text className="text-emerald-400 text-[9px] font-sora-bold ml-1">
              CLAIMED
            </Text>
          </View>
        ) : item.done ? (
          <Pressable
            disabled={claiming}
            onPress={onClaim}
            className={`ml-2.5 h-7 min-w-[72px] rounded-full px-3 flex-row items-center justify-center ${
              isDark ? "bg-white" : "bg-accent"
            }`}
          >
            {claiming ? (
              <ActivityIndicator color={isDark ? "black" : "#0c0c0c"} size="small" />
            ) : (
              <Text className={`text-[9px] font-sora-bold ${isDark ? "text-black" : "text-bg"}`}>
                CLAIM +{item.reward}
              </Text>
            )}
          </Pressable>
        ) : (
          <View className="ml-2.5 flex-row items-center">
            <Zap size={12} color={item.color} />
            <Text
              className="text-[10px] font-sora-bold ml-1"
              style={{ color: item.color }}
            >
              +{item.reward}
            </Text>
          </View>
        )}
      </View>

      {/* Progress count */}
      <Text className="text-quaternary text-[9px] font-sora tabular-nums mt-1.5">
        {item.progress} / {item.target}
      </Text>
    </View>
  );
}

const claimedColor = (item: ChallengeProgress, isDark: boolean) =>
  item.claimed ? (isDark ? "#52525b" : "#a1a1aa") : item.color;

const CheckMini = () => (
  <View className="w-3.5 h-3.5 rounded-full bg-emerald-400 items-center justify-center">
    <Text className="text-white text-[8px] font-sora-bold leading-none">✓</Text>
  </View>
);