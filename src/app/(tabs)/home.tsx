import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import ContributionGraph from "@/components/ContributionGraph";
import GrowthStat from "@/components/home/GrowthStat";
import { getGreeting } from "@/constants/time";
import { useApp } from "@/context/app-context";
import { getHabits } from "@/libs/sqlite/habits";
import { getSpiritState, initializeSpirit } from "@/libs/sqlite/spirit";
import { getDailyStreak } from "@/libs/sqlite/streak";
import { router } from "expo-router";
import { Flame } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  const [spirit, setSpirit] = useState<any>(null);
  const { habits, setHabits } = useApp();
  const [streak, setStreak] = useState<any>(0);

  const { top } = useSafeAreaInsets();

  const { user } = useApp();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await initializeSpirit();
    const s = await getSpiritState();
    const h = await getHabits();
    const currentStreak = await getDailyStreak();

    setSpirit(s);
    setHabits(h);
    setStreak(currentStreak);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{
        paddingTop: top + 10,
      }}
      className="flex-1 bg-bg px-5 "
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Avatar />
        <Text className="text-white flex-1 ml-3 text-lg font-sora-semibold">
          {getGreeting()} User
        </Text>

        {/* Streak */}
        <View className="flex-row items-center">
          <Flame color={"#fff"} />
          <Text className="text-white font-sora-semibold text-base">
            {streak || 0}
          </Text>
        </View>
      </View>

      {/* Growth Stats */}

      <GrowthStat streak={streak} xp={spirit?.totalXP || 0} />

      {/* CTA */}
      <Pressable
        onPress={() => router.push("/(auth)/signin")}
        className="bg-white py-4 mt-8 rounded-xl items-center"
      >
        <Text className="text-black font-sora-semibold text-base">
          Try Quiet Time
        </Text>
      </Pressable>

      <ContributionGraph />

      {/* TODAY STATUS */}
      {/* <View className="mt-10 bg-gray-50 rounded-3xl p-5">
        <Text className="font-bold text-lg">Today’s Progress</Text>

        <Text className="text-gray-600 mt-2">
          Habits Created: {habits.length}
        </Text>

        <Text className="text-gray-600 mt-1">Spirit Growth: {xp} XP</Text>
      </View> */}

      <View className="h-20" />
    </ScrollView>
  );
}
