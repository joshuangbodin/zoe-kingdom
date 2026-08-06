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
import { Flame, BookOpen } from "lucide-react-native";
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
    return () => { mounted = false; };
  }, [user?.uid]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" size="small" />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ paddingTop: top + 8 }}
      className="flex-1 bg-bg px-5"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center">
          <Avatar index={user?.avatar} diameter={36} />
          <View className="ml-3">
            <Text className="text-white text-sm font-sora-semibold">
              {getGreeting()}, {user?.username || "User"}
            </Text>
            <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">Welcome back</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-card-1 rounded-xl px-3 py-2">
          <Flame size={14} color="#facc15" />
          <Text className="text-white text-sm font-sora-semibold ml-1.5">
            {streak || 0}
          </Text>
        </View>
      </View>

      {/* Growth Stats */}
      <GrowthStat streak={streak} xp={spirit?.totalXP || 0} />

      {/* Quick Actions */}
      <View className="flex-row gap-2 mt-6">
        <Pressable
          onPress={() => router.push("/(tabs)/bible")}
          className="flex-1 bg-card-1 rounded-2xl p-4 flex-row items-center"
        >
          <View className="w-9 h-9 rounded-xl bg-amber-500/10 items-center justify-center">
            <BookOpen size={16} color="#fbbf24" />
          </View>
          <Text className="text-white text-sm font-sora-semibold ml-3">Scripture</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/habits")}
          className="flex-1 bg-card-1 rounded-2xl p-4 flex-row items-center"
        >
          <View className="w-9 h-9 rounded-xl bg-green-500/10 items-center justify-center">
            <BookOpen size={16} color="#4ade80" />
          </View>
          <Text className="text-white text-sm font-sora-semibold ml-3">Habits</Text>
        </Pressable>
      </View>

      {/* Consistency */}
      <ContributionGraph />

      <View className="h-20" />
    </ScrollView>
  );
}