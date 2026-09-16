import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "@/components/Toast";
import { getChallengePeriod } from "@/constants/challenges";
import { getLevelFromXP, getProgressPercentage } from "@/constants/levels";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
import { getLeaderboard } from "@/libs/firebase/leaderboard";
import type { ChallengeProgress } from "@/libs/sqlite/challenges";
import {
  claimChallenge,
  getChallengesWithProgress,
} from "@/libs/sqlite/challenges";

import ArenaHeader, {
  ArenaSection,
} from "@/components/arena/ArenaHeader";
import ChallengeCard from "@/components/arena/ChallengeCard";
import LeaderboardPodium from "@/components/arena/LeaderboardPodium";
import LeaderboardRow from "@/components/arena/LeaderboardRow";

export default function Games() {
  const { top } = useSafeAreaInsets();
  const { user, refreshUser } = useApp();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [section, setSection] = useState<ArenaSection>("challenges");
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
  const userLevel = getLevelFromXP(user?.xp ?? 0);
  const userXpProgress = getProgressPercentage(user?.xp ?? 0);

  // Top-3 go on the podium; the rest render as compact rows below.
  const podUsers = leaderboard.filter((r: any) => r.rank <= 3);
  const listRows = section === "leaderboard"
    ? leaderboard.filter((r: any) => r.rank > 3)
    : challenges;
  const data = section === "challenges" ? challenges : listRows;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 6 }}>
      <FlatList
        data={data as any[]}
        keyExtractor={(item: any) =>
          section === "challenges" ? item.id : item.uid
        }
        contentContainerClassName="px-3"
        renderItem={
          section === "challenges"
            ? ({ item }: { item: ChallengeProgress }) => (
                <ChallengeCard
                  item={item}
                  claiming={claimingId === item.id}
                  onClaim={() => handleClaim(item)}
                />
              )
            : ({ item }: { item: any }) => <LeaderboardRow item={item} />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#0c0c0c"}
            progressBackgroundColor={isDark ? "#18181b" : "#f4f4f5"}
          />
        }
        ListHeaderComponent={
          <View>
            <ArenaHeader
              section={section}
              onSectionChange={setSection}
              rightMeta={section === "challenges" ? period : "Lifetime XP"}
            />
            {section === "leaderboard" && (
              <LeaderboardPodium users={podUsers} />
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* User progress footer (your path to the next level) */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-card-1/95 border-t border-line px-5 py-3 flex-row items-center"
        style={{ paddingBottom: 12 }}
      >
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-primary text-[10px] font-sora-semibold">
              Level {userLevel}
            </Text>
            <Text className="text-quaternary text-[9px] font-sora-medium">
              {Math.round(userXpProgress)}% to {userLevel + 1}
            </Text>
          </View>
          <View className="h-[3px] mt-1.5 bg-overlay rounded-full overflow-hidden">
            <View
              style={{ width: `${userXpProgress}%` }}
              className="h-full bg-amber-500 rounded-full"
            />
          </View>
        </View>
      </View>
    </View>
  );
}