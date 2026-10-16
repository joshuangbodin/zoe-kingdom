import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { LEVELS, getGameRank, getStoryProgress } from "@/data/story";
import type { StoryLevel } from "@/data/story";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
import type { ChallengeProgress } from "@/libs/sqlite/challenges";
import {
  claimChallenge,
  getChallengesWithProgress,
} from "@/libs/sqlite/challenges";
import {
  getCompletedNodeIds,
  getEnergy,
  getStarsByNode,
  type EnergyState,
} from "@/libs/sqlite/story";

import ArenaHeader, {
  ArenaSection,
} from "@/components/arena/ArenaHeader";
import ChallengeCard from "@/components/arena/ChallengeCard";
import DialogueSheet, {
  type DialogueSheetHandle,
} from "@/components/story/DialogueSheet";
import EnergyBar from "@/components/story/EnergyBar";
import PuzzleSheet, {
  type PuzzleSheetHandle,
} from "@/components/story/PuzzleSheet";
import StoryMap from "@/components/story/StoryMap";
import StoryProgressCard from "@/components/story/StoryProgressCard";

export default function Games() {
  const { top } = useSafeAreaInsets();
  const { refreshUser } = useApp();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [section, setSection] = useState<ArenaSection>("journey");
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [energy, setEnergy] = useState<EnergyState>({
    energy: 0,
    maxEnergy: 30,
    refilledToday: false,
    levelsAffordable: 0,
  });
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [stars, setStars] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const dialogueRef = useRef<DialogueSheetHandle>(null);
  const puzzleRef = useRef<PuzzleSheetHandle>(null);

  const loadStory = useCallback(async () => {
    const [e, c, s] = await Promise.all([
      getEnergy(),
      getCompletedNodeIds(),
      getStarsByNode(),
    ]);
    setEnergy(e);
    setCompleted(c);
    setStars(s);
  }, []);

  const loadChallenges = useCallback(async () => {
    setChallenges(await getChallengesWithProgress());
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([loadChallenges(), loadStory()]);
    setLoading(false);
  }, [loadChallenges, loadStory]);

  useEffect(() => {
    loadData().catch((e) => {
      console.error("Arena load error:", e);
      setLoading(false);
    });
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        await loadChallenges();
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

  /* ------------------------------- Story flow ------------------------------ */

  /**
   * Tapping a map node opens its animated dialogue first — the player always
   * hears the story and their mission before spending any energy.
   */
  const openLevel = useCallback((level: StoryLevel) => {
    dialogueRef.current?.present(level);
  }, []);

  /** The player accepted the mission: hand over to the puzzle. */
  const beginPuzzle = useCallback((level: StoryLevel) => {
    requestAnimationFrame(() => puzzleRef.current?.present(level));
  }, []);

  const handleSolved = useCallback(
    async (reward: number) => {
      showToast(`+${reward} XP — the verse is restored!`, "success");
      await Promise.all([loadStory(), refreshUser().catch(() => {})]);
    },
    [loadStory, refreshUser, showToast],
  );

  const period = getChallengePeriod();

  // Journey header stats: story progress and the player's game rank.
  const progressPct = getStoryProgress(completed);
  const rank = getGameRank(completed.size);
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={isDark ? "#fff" : "#0c0c0c"} size="small" />
      </View>
    );
  }

  // Only the Challenges segment renders a scrolling list; the Journey section
  // is fully rendered in the header (energy bar + story map).
  const data = section === "challenges" ? challenges : [];

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 6 }}>
      <FlatList
        data={data as any[]}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-3"
        renderItem={({ item }: { item: ChallengeProgress }) => (
          <ChallengeCard
            item={item}
            claiming={claimingId === item.id}
            onClaim={() => handleClaim(item)}
          />
        )}
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
              rightMeta={section === "challenges" ? period : "Zoe's Journey"}
            />

            {section === "journey" && (
              <View>
                <StoryProgressCard
                  progressPct={progressPct}
                  rankTitle={rank.title}
                  nextRank={rank.next}
                  levelsDone={completed.size}
                  levelsTotal={LEVELS.length}
                  totalStars={totalStars}
                  maxStars={LEVELS.length * 3}
                />

                <EnergyBar energy={energy.energy} maxEnergy={energy.maxEnergy} />

                <StoryMap
                  completed={completed}
                  stars={stars}
                  energy={energy.energy}
                  onNodePress={openLevel}
                />
              </View>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      <DialogueSheet ref={dialogueRef} onBegin={beginPuzzle} />
      <PuzzleSheet ref={puzzleRef} onSolved={handleSolved} />
    </View>
  );
}
