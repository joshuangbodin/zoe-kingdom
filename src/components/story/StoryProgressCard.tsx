/**
 * StoryProgressCard — the header summary for the Journey section.
 *
 * Shows the player's GAME RANK (deliberately separate from the app's spiritual
 * Altar Fire level), their star haul, and overall story progress. It answers
 * "where am I, and how far is there to go" before the player ever looks at the
 * map.
 */

import React from "react";
import { Text, View } from "react-native";

import StarRow from "./StarRow";

type Props = {
  progressPct: number;
  rankTitle: string;
  nextRank: string | null;
  levelsDone: number;
  levelsTotal: number;
  totalStars: number;
  maxStars: number;
};

export default function StoryProgressCard({
  progressPct,
  rankTitle,
  nextRank,
  levelsDone,
  levelsTotal,
  totalStars,
  maxStars,
}: Props) {
  return (
    <View className="bg-card-2 shadow-sm rounded-3xl p-4 mb-4 ">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 min-w-0">
          <Text className="text-quaternary text-[9px] font-sora-bold ">
            Game Rank
          </Text>
          <Text className="text-primary text-[17px] font-sora-semibold mt-0.5">
            {rankTitle}
          </Text>
          {nextRank ? (
            <Text className="text-tertiary text-[10px] font-sora mt-0.5">
              Next: {nextRank}
            </Text>
          ) : (
            <Text className="text-amber-400 text-[10px] font-sora-semibold mt-0.5">
              Highest rank reached
            </Text>
          )}
        </View>

        <View className="items-end">
          <StarRow stars={3} size={12} />
          <Text className="text-secondary text-[11px] font-sora-semibold tabular-nums mt-1">
            {totalStars}
            <Text className="text-tertiary text-[10px] font-sora">
              {" "}
              / {maxStars} ★
            </Text>
          </Text>
        </View>
      </View>

      <View className="h-4 bg-overlay rounded-full mt-4 overflow-hidden mb-2">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(progressPct, 100)}%`, backgroundColor: "#a855f7" }}
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-tertiary text-[10px] font-sora">
          {levelsDone} of {levelsTotal} levels restored
        </Text>
        <Text className="text-tertiary text-[10px] font-sora-bold tabular-nums">
          {progressPct}%
        </Text>
      </View>
    </View>
  );
}
