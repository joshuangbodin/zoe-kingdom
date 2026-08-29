import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import Avatar from "@/components/Avatar";
import ContributionGraph from "@/components/ContributionGraph";
import GrowthStat from "@/components/home/GrowthStat";
import { getFirstName, getGreeting } from "@/constants/time";
import { useApp } from "@/context/app-context";
import { getHabits } from "@/libs/sqlite/habits";
import { getSpiritState, initializeSpirit } from "@/libs/sqlite/spirit";
import { getDailyStreak } from "@/libs/sqlite/streak";
import { router } from "expo-router";
import { BookOpen, Flame } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUICK_ACTIONS: {
  key: string;
  label: string;
  caption: string;
  route: any;
  color: string;
  tileBg: string;
}[] = [
  {
    key: "scripture",
    label: "Scripture",
    caption: "Daily devotion",
    route: "/(tabs)/bible",
    color: "#fbbf24",
    tileBg: "bg-amber-500/10",
  },
  {
    key: "habits",
    label: "Habits",
    caption: "Build your rhythm",
    route: "/(tabs)/habits",
    color: "#34d399",
    tileBg: "bg-emerald-500/10",
  },
];

export default function Home() {
  const [spirit, setSpirit] = useState<any>(null);
  const { setHabits, user, refreshUser } = useApp();
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const { top } = useSafeAreaInsets();

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

        // Fresh copy of the profile from Firestore (falls back to cache offline).
        await refreshUser();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" size="small" />
      </View>
    );
  }

  const firstName = getFirstName(user?.username);

  return (
    <View className="flex-1 bg-bg">
      {/* FIXED HEADER — pinned, does not scroll with the page */}
      <View
        style={{ paddingTop: top + 8, paddingBottom: 12 }}
        className="px-5 bg-bg border-b border-line"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 min-w-0">
            <Avatar index={user?.avatar} diameter={38} />
            <View className="ml-3 flex-1 min-w-0">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="text-primary text-[15px] font-sora-semibold"
              >
                {getGreeting()}, {firstName}
              </Text>
              <Text className="text-tertiary text-[11px] font-sora mt-0.5">
                Welcome back
              </Text>
            </View>
          </View>

          <View className="flex-row items-center bg-card-1 rounded-full pl-2.5 pr-3.5 py-2 ml-3">
            <Flame size={14} color="#f59e0b" />
            <Text className="text-primary text-[13px] font-sora-semibold ml-1.5">
              {streak || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
      >
        <GrowthStat streak={streak} xp={spirit?.totalXP || 0} />

        {/* Quick Actions */}
        <View className="flex-row gap-3 mt-5">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => router.push(action.route)}
              className="flex-1 bg-card-1 rounded-2xl p-4"
            >
              <View
                className={`w-9 h-9 rounded-xl items-center justify-center ${action.tileBg}`}
              >
                <BookOpen size={16} color={action.color} />
              </View>
              <Text className="text-primary text-sm font-sora-semibold mt-3">
                {action.label}
              </Text>
              <Text className="text-tertiary text-[11px] font-sora mt-0.5">
                {action.caption}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Consistency */}
        <ContributionGraph />
      </ScrollView>
    </View>
  );
}