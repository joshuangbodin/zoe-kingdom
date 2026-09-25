import { Trophy } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

/**
 * Shown when the leaderboard has no ranked players yet. Encourages users to
 * start completing habits so their XP proudly appears on the board.
 */
export default function LeaderboardEmptyState() {
  return (
    <View className="items-center justify-center pt-10 pb-12 px-10">
      <View className="w-16 h-16 rounded-full bg-card-2 items-center justify-center">
        <Trophy size={28} color="#f59e0b" />
      </View>
      <Text className="text-primary text-sm font-sora-semibold mt-4">
        No players ranked yet
      </Text>
      <Text className="text-quaternary text-center mt-2 text-xs leading-5 font-sora">
        Complete habits to earn XP and climb your way onto the leaderboard.
      </Text>
    </View>
  );
}