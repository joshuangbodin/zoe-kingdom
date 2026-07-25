import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import ContributionGraph from "@/components/ContributionGraph";
import GrowthStat from "@/components/home/GrowthStat";
import { getGreeting } from "@/constants/time";
import { useApp } from "@/context/app-context";
import { getUserProfile } from "@/libs/firebase/users";
import { getHabits } from "@/libs/sqlite/habits";
import { getSpiritState, initializeSpirit } from "@/libs/sqlite/spirit";
import { getDailyStreak } from "@/libs/sqlite/streak";
import { router } from "expo-router";
import { Flame } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  const [spirit, setSpirit] = useState<any>(null);
  const { habits, setHabits } = useApp();
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const { top } = useSafeAreaInsets();
  const { user, setUser } = useApp();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        await initializeSpirit();
        const [s, h, currentStreak] = await Promise.all([
          getSpiritState(),
          getHabits(),
          getDailyStreak(),
        ]);

        if (!mounted) return;

        setSpirit(s);
        setHabits(h);
        setStreak(currentStreak || 0);

        // Try to get user profile if we have a uid
        if (user?.uid) {
          try {
            const udata = await getUserProfile(user.uid);
            if (udata && mounted) {
              setUser({ ...user, ...udata });
            }
          } catch (profileErr) {
            console.error("Failed to load user profile:", profileErr);
          }
        }
      } catch (err) {
        console.error("Home loadData error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{
        paddingTop: top + 10,
      }}
      className="flex-1 bg-bg px-5"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Avatar index={user?.avatar} />
        <Text className="text-white flex-1 ml-3 text-lg font-sora-semibold">
          {getGreeting()} {user?.username || "User"}
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
        onPress={() => router.push("/(tabs)/bible")}
        className="bg-white py-4 mt-8 rounded-xl items-center"
      >
        <Text className="text-black font-sora-semibold text-base">
          Read Today's Scripture
        </Text>
      </Pressable>

      <ContributionGraph />

      <View className="h-20" />
    </ScrollView>
  );
}