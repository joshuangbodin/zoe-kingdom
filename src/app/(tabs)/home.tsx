import React, { useEffect, useRef, useState } from "react";
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
import StreakProgressModal, {
  StreakProgressModalHandle,
} from "@/components/home/StreakProgressModal";
import { getFirstName, getGreeting } from "@/constants/time";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
import { getHabits } from "@/libs/sqlite/habits";
import { getSpiritState, initializeSpirit } from "@/libs/sqlite/spirit";
import { getDailyStreak } from "@/libs/sqlite/streak";
import { router } from "expo-router";
import { BookOpen, Flame, Target } from "lucide-react-native";
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
  const streakModalRef = useRef<StreakProgressModalHandle>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

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
        <ActivityIndicator color={isDark ? "#fff" : "#0c0c0c"} size="small" />
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
                {getGreeting()}
              </Text>
              <Text className="text-tertiary text-[11px] font-sora mt-0.5">
                {firstName}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => streakModalRef.current?.present()}
            className="flex-row items-center bg-card-1 rounded-full pl-2.5 pr-3.5 py-2 ml-3"
          >
            <Flame size={14} color="#f59e0b" />
            <Text className="text-primary text-[13px] font-sora-semibold ml-1.5">
              {streak || 0}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
      >
        <GrowthStat
          streak={streak}
          xp={spirit?.totalXP || 0}
          onStreakPress={() => streakModalRef.current?.present()}
        />

        {/* Quick Actions */}
        <View className="flex-row gap-3 mt-2.5">
          {QUICK_ACTIONS.map((action, index) => (
            <Pressable
              key={action.key}
              onPress={() => router.push(action.route)}
              className="flex-1 flex-row bg-card-1 items-center rounded-lg p-2.5 gap-2"
            >
              <View
                className={`w-9 h-9 rounded-md items-center justify-center ${action.tileBg}`}
              >
                {index == 0 ? (
                  <BookOpen size={16} color={action.color} />
                ) : (
                  <Target size={16} color={action.color} />
                )}
              </View>
              <View>
                <Text className="text-primary text-xs font-sora-semibold ">
                  {action.label}
                </Text>
                <Text className="text-tertiary text-[10px] font-sora ">
                  {action.caption}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Consistency */}
        <ContributionGraph />
      </ScrollView>

      <StreakProgressModal
        ref={streakModalRef}
        streak={streak || 0}
      />
    </View>
  );
}
