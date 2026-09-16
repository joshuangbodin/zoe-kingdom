import React from "react";
import { Text, View } from "react-native";
import { Trophy } from "lucide-react-native";

import Avatar from "@/components/Avatar";

export type PodiumUser = {
  uid: string;
  username: string;
  avatar: number;
  seasonXP: number;
  level: number;
  rank: number;
  isYou: boolean;
};

const STEPS: Record<number, { h: number; color: string; order: number }> = {
  1: { h: 84, color: "#f59e0b", order: 1 },
  2: { h: 64, color: "#cbd5e1", order: 0 },
  3: { h: 54, color: "#d97706", order: 2 },
};

type Props = { users: PodiumUser[] };

/**
 * Playful top-3 podium. Order is laid out 2 · 1 · 3 with floating avatars who
 * sit just above steps of increasing height. Everyone else stays in the list.
 */
export default function LeaderboardPodium({ users }: Props) {
  if (users.length === 0) return null;

  const sorted = [...users].sort((a, b) => a.rank - b.rank);
  const top = sorted.slice(0, 3);

  // Render and style by the user's actual rank, but order visually 2·1·3.
  const ordered = top
    .map((u) => ({ ...u, step: STEPS[u.rank] }))
    .sort((a, b) => a.step.order - b.step.order);

  return (
    <View className="p-4 mt-6 mb-5 bg-card-1 rounded-3xl">
      <Text className="text-secondary text-[10px] font-sora-semibold uppercase tracking-wider mb-4 text-center">
        Top Players
      </Text>

      <View className="flex-row items-end justify-center gap-3">
        {ordered.map((u) => (
          <View key={u.uid} className="items-center" style={{ width: 96 }}>
            {/* Floating avatar */}
            <View
              className={`items-center  rounded-full justify-end ${u.isYou ? "bg-amber-300/50 border border-amber-400" : "bg-bg"}`}
              style={{
                width: u.step.h ,
                height: u.step.h ,
              }}
            >
              <Avatar index={u.avatar} diameter={u.step.h} />
            </View>

            {/* Meta */}
            <View className="items-center mb-4">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-primary text-[11px] font-sora-semibold mt-0.5 max-w-24"
              >
                {u.username}
              </Text>
              <Text className="text-[9px] font-sora-medium text-tertiary">
                {u.seasonXP.toLocaleString()} XP
              </Text>
            </View>

            {/* Step / pedestal */}
            <View
              className="w-full rounded-t-2xl items-center justify-start"
              style={{ height: u.step.h, backgroundColor: u.step.color }}
            >
              
              <Text className="text-primary text-2xl font-sora-bold tabular-nums mt-0.5">
                {u.rank}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}