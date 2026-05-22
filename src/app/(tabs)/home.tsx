import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import ContributionGraph from "@/components/ContributionGraph";
import { getGreeting } from "@/constants/time";
import { useApp } from "@/context/app-context";
import { getHabits } from "@/libs/sqlite/habits";
import { getSpiritState } from "@/libs/sqlite/spirit";
import { Flame } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  const [spirit, setSpirit] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const { top } = useSafeAreaInsets();

  const { user } = useApp();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await getSpiritState();
    const h = await getHabits();

    setSpirit(s);
    setHabits(h);
  };

  const level = spirit?.level || 1;
  const xp = spirit?.totalXP || 0;

  return (
    <ScrollView
      style={{
        paddingTop: top + 10,
      }}
      className="flex-1 bg-bg px-5 "
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Avatar />
        <Text className="text-white flex-1 ml-3 text-lg font-sora-semibold">
          {getGreeting()}
        </Text>

        {/* Streak */}
        <View className="flex-row items-center">
          <Flame color={"#fff"} />
          <Text className="text-white font-sora-semibold text-base">0</Text>
        </View>
      </View>

      {/* SPIRIT AVATAR CARD */}
      <View className="mt-8 bg-green-50 rounded-3xl p-6 items-center">
        <Text className="text-5xl">
          {level < 5 ? "🌱" : level < 10 ? "🌿" : level < 20 ? "🔥" : "👑"}
        </Text>

        <Text className="text-xl font-bold mt-3">Spirit Level {level}</Text>

        <Text className="text-gray-600 mt-1">XP: {xp}</Text>

        <Text className="text-green-700 mt-2 font-medium">
          {level < 5
            ? "Seed Stage"
            : level < 10
              ? "Growing Spirit"
              : level < 20
                ? "Burning Faith"
                : "Kingdom Mature"}
        </Text>
      </View>

      {/* HABIT SUMMARY (GitHub-style idea) */}
      <View className="mt-8">
        <Text className="text-lg font-bold mb-3">Consistency Tracker 🔥</Text>

        {/* <View className="flex-row flex-wrap gap-2">
          {habits.map((h, i) => (
            <View
              key={h.id}
              className="w-6 h-6 rounded-sm"
              style={{
                backgroundColor:
                  h.streak === 0
                    ? "#e5e7eb"
                    : h.streak < 3
                    ? "#86efac"
                    : h.streak < 7
                    ? "#22c55e"
                    : "#15803d",
              }}
            />
          ))}
        </View> */}
        <ContributionGraph />

        {habits.length === 0 && (
          <Text className="text-gray-400 mt-2">
            No habits yet — go to Habits tab to start building consistency.
          </Text>
        )}
      </View>

      {/* TODAY STATUS */}
      <View className="mt-10 bg-gray-50 rounded-3xl p-5">
        <Text className="font-bold text-lg">Today’s Progress</Text>

        <Text className="text-gray-600 mt-2">
          Habits Created: {habits.length}
        </Text>

        <Text className="text-gray-600 mt-1">Spirit Growth: {xp} XP</Text>
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}
