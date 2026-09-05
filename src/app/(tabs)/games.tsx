import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Calendar,
  Check,
  Flame,
  Trophy,
  Zap,
} from "lucide-react-native";

import Avatar from "@/components/Avatar";
import { useTheme } from "@/context/theme-context";
import { useToast } from "@/components/Toast";
import { getChallengePeriod } from "@/constants/challenges";
import type { ChallengeProgress } from "@/libs/sqlite/challenges";
import {
  claimChallenge,
  getChallengesWithProgress,
} from "@/libs/sqlite/challenges";
import { getLeaderboard } from "@/libs/firebase/leaderboard";
import { useApp } from "@/context/app-context";

type Section = "leaderboard" | "challenges";
const iconFor = (name: string, size: number, color: string) => {
  switch (name) {
    case "Flame":
      return <Flame size={size} color={color} />;
    case "Check":
      return <Check size={size} color={color} />;
    case "Calendar":
      return <Calendar size={size} color={color} />;
    default:
      return <Zap size={size} color={color} />;
  }
};

export default function Games() {
  const { top } = useSafeAreaInsets();
  const { user, refreshUser } = useApp();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [section, setSection] = useState<Section>("challenges");
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [ch, lb] = await Promise.all([
      getChallengesWithProgress(),
      getLeaderboard(user?.uid, 50),
    ]);
    setChallenges(ch);
    setLeaderboard(lb);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    loadData().catch((e) => {
      console.error("Arena load error:", e);
      setLoading(false);
    });
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadData(), refreshUser().catch(() => {})]);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData]);

  const handleClaim = async (ch: ChallengeProgress) => {
    setClaimingId(ch.id);
    try {
      const res = await claimChallenge(ch);
      if (res.success) {
        showToast(`+${ch.reward} XP claimed!`, "success");
        await loadData();
        refreshUser().catch(() => {});
      } else {
        showToast("Already claimed", "info");
      }
    } catch (e) {
      console.error("Claim error:", e);
      showToast("Could not claim reward", "error");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={isDark ? "#fff" : "#0c0c0c"} size="small" />
      </View>
    );
  }

  const period = getChallengePeriod();
  /* ------------------------------ Leaderboard row ------------------------------ */
  const renderLeaderboardItem = ({ item }: { item: any }) => {
    const medal =
      item.rank === 1
        ? "#fbbf24"
        : item.rank === 2
          ? "#c0c0c0"
          : item.rank === 3
            ? "#d97706"
            : "#666";
    return (
      <View
        className={`flex-row items-center px-4 py-3 rounded-2xl mb-2 ${
          item.isYou ? "bg-overlay border border-primary/40" : "bg-card-1"
        }`}
      >
        <Text
          className={`w-8 font-sora-bold text-sm ${item.rank <= 3 ? "" : "text-tertiary"}`}
          style={item.rank <= 3 ? { color: medal } : undefined}
        >
          {item.rank}
        </Text>
        <Avatar index={item.avatar} diameter={34} />
        <View className="flex-1 ml-3">
          <Text className="text-primary text-sm font-sora-semibold">
            {item.username}
            {item.isYou && (
              <Text className="text-secondary text-[10px] font-sora ml-1">
                (you)
              </Text>
            )}
          </Text>
          <Text className="text-tertiary text-[10px] font-sora mt-0.5">
            Level {item.level}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Zap size={13} color="#facc15" />
          <Text className="text-primary text-sm font-sora-bold ml-1">
            {item.seasonXP}
          </Text>
        </View>
      </View>
    );
  };

  /* ------------------------------ Challenge card ------------------------------ */
  const renderChallenge = ({ item }: { item: ChallengeProgress }) => {
    const claimed = item.claimed;
    const done = item.done;
    const pct = item.target > 0 ? (item.progress / item.target) * 100 : 0;

    return (
      <View className="bg-card-1 rounded-2xl p-5 mb-3">
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: item.color + "22" }}
          >
            {iconFor(item.icon, 18, item.color)}
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-primary text-sm font-sora-semibold">
              {item.title}
            </Text>
            <Text className="text-tertiary text-[10px] font-sora mt-0.5">
              {item.description}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Zap size={13} color="#facc15" />
            <Text className="text-primary text-sm font-sora-bold ml-1">
              +{item.reward}
            </Text>
          </View>
        </View>

        <View className="h-2 bg-overlay rounded-full mt-4 overflow-hidden">
          <View
            style={{
              width: `${pct}%`,
              backgroundColor: claimed ? "#71717a" : item.color,
            }}
            className="h-full rounded-full"
          />
        </View>
        <Text className="text-secondary text-[10px] font-sora mt-1.5">
          {item.progress}/{item.target}
        </Text>

        {claimed ? (
          <View className="mt-3 rounded-xl py-3 items-center bg-overlay">
            <Text className="text-secondary text-xs font-sora-semibold">
              Claimed ✓
            </Text>
          </View>
        ) : done ? (
          <Pressable
            disabled={claimingId === item.id}
            onPress={() => handleClaim(item)}
            className={`mt-3 rounded-xl py-3 items-center ${
              isDark ? "bg-white" : "bg-accent"
            }`}
          >
            {claimingId === item.id ? (
              <ActivityIndicator color={isDark ? "black" : "#0c0c0c"} size="small" />
            ) : (
              <Text
                className={`text-xs font-sora-semibold ${
                  isDark ? "text-black" : "text-bg"
                }`}
              >
                Claim +{item.reward} XP
              </Text>
            )}
          </Pressable>
        ) : (
          <View className="mt-3 rounded-xl py-3 items-center bg-card-2">
            <Text className="text-tertiary text-xs font-sora-semibold">
              Keep going — {item.progress}/{item.target}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const data = section === "challenges" ? (challenges as any) : leaderboard;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
      <FlatList
        data={data}
        keyExtractor={(item: any) =>
          section === "challenges" ? item.id : item.uid
        }
        renderItem={
          section === "challenges" ? renderChallenge : renderLeaderboardItem
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#0c0c0c"}
          />
        }
        ListHeaderComponent={
          <View className="px-5 mb-4">
            {/* Hero header */}
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-2xl bg-indigo-500/15 items-center justify-center">
                  <Trophy size={20} color="#818cf8" />
                </View>
                <View className="ml-3">
                  <Text className="text-primary text-xl font-sora-bold tracking-tight">
                    Arena
                  </Text>
                  <Text className="text-tertiary text-xs font-sora">
                    Compete, grow, and earn XP
                  </Text>
                </View>
              </View>
              <View className="bg-card-1 rounded-full px-3 py-1.5 flex-row items-center">
                <Zap size={12} color="#facc15" />
                <Text className="text-primary text-xs font-sora-semibold ml-1">
                  Season
                </Text>
              </View>
            </View>

            <View className="flex-row bg-card-1 rounded-2xl p-1 mb-4">
              <Pressable
                onPress={() => setSection("challenges")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  section === "challenges"
                    ? isDark
                      ? "bg-white"
                      : "bg-bg"
                    : ""
                }`}
              >
                <Text
                  className={`text-xs font-sora-semibold ${
                    section === "challenges"
                      ? isDark
                        ? "text-black"
                        : "text-primary"
                      : "text-secondary"
                  }`}
                >
                  Weekly Challenges
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSection("leaderboard")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  section === "leaderboard"
                    ? isDark
                      ? "bg-white"
                      : "bg-bg"
                    : ""
                }`}
              >
                <Text
                  className={`text-xs font-sora-semibold ${
                    section === "leaderboard"
                      ? isDark
                        ? "text-black"
                        : "text-primary"
                      : "text-secondary"
                  }`}
                >
                  Leaderboard
                </Text>
              </Pressable>
            </View>

            {section === "challenges" && (
              <View className="flex-row items-center justify-between px-1 mb-2">
                <View className="flex-row items-center">
                  <Trophy size={14} color="#fbbf24" />
                  <Text className="text-primary text-sm font-sora-semibold ml-2">
                    This Week's Challenges
                  </Text>
                </View>
                <View className="bg-card-1 rounded-full px-2.5 py-1">
                  <Text className="text-tertiary text-[10px] font-sora">
                    {period}
                  </Text>
                </View>
              </View>
            )}

            {section === "leaderboard" && (
              <View className="px-1 mb-2">
                <Text className="text-primary text-sm font-sora-semibold">
                  Global Leaderboard
                </Text>
                <Text className="text-tertiary text-[10px] font-sora mt-0.5">
                  Ranked by lifetime XP. Sync on the Profile tab to update your
                  score.
                </Text>
              </View>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />
    </View>
  );
}

