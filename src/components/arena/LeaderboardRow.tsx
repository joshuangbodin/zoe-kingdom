import React from "react";
import { Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import { useTheme } from "@/context/theme-context";

import type { PodiumUser } from "./LeaderboardPodium";

type Props = { item: PodiumUser };

/** Compact single leaderboard row used for everyone below the podium. */
export default function LeaderboardRow({ item }: Props) {
  const { isDark } = useTheme();

  return (
    <View
      className={`flex-row items-center px-4 h-[52px] ${
        item.isYou
          ? "bg-amber-500/[0.08] rounded-2xl border border-amber-500/25"
          : ""
      }`}
    >
      {/* Rank */}
      <Text
        className="w-7 text-center font-sora-semibold text-xs tabular-nums"
        style={{ color: isDark ? "#e4e4e7" : "#3f3f46" }}
      >
        {item.rank}
      </Text>

      <View className="ml-2.5">
        <Avatar index={item.avatar} diameter={34} />
      </View>

      <View className="flex-1 ml-3 min-w-0">
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-primary text-[13px] font-sora-semibold"
          >
            {item.username}
          </Text>
          {item.isYou && (
            <View className="ml-2 bg-amber-500/15 rounded-[6px] px-1.5 py-[1px]">
              <Text className="text-amber-500 text-[8px] font-sora-bold tracking-wide">
                YOU
              </Text>
            </View>
          )}
        </View>
        <Text className="text-tertiary text-[10px] font-sora mt-[1px]">
          LVL {item.level}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Text className="text-primary text-[13px] font-sora-bold tabular-nums">
          {item.seasonXP.toLocaleString()}
        </Text>
        <Text className="text-tertiary text-[9px] font-sora-medium ml-1 mt-[1px]">
          XP
        </Text>
      </View>
    </View>
  );
}