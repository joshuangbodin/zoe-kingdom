
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, Trophy, Zap } from "lucide-react-native";

import { useToast } from "@/components/Toast";
import { getChallengePeriod } from "@/constants/challenges";

import {
  LEVELS,
  getGameRank,
  getStoryProgress,
} from "@/data/story";

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
  type ArenaSection,
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

/* -------------------------------- Constants ------------------------------- */

const INITIAL_ENERGY: EnergyState = {
  energy: 0,
  maxEnergy: 30,
  refilledToday: false,
  levelsAffordable: 0,
};

/* --------------------------------- Screen --------------------------------- */

export default function Games() {
  const { top } = useSafeAreaInsets();
  const { refreshUser } = useApp();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const accent = isDark ? "#B9A2FF" : "#7654D6";

  const [section, setSection] = useState<ArenaSection>("journey");

  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [energy, setEnergy] = useState<EnergyState>(INITIAL_ENERGY);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [stars, setStars] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const dialogueRef = useRef<DialogueSheetHandle>(null);
  const puzzleRef = useRef<PuzzleSheetHandle>(null);

  const mountedRef = useRef(false);
  const refreshLockRef = useRef(false);
  const claimingRef = useRef(new Set<string>());

  /* --------------------------------- Data --------------------------------- */

  const loadStory = useCallback(async () => {
    const [energyData, completedData, starsData] = await Promise.all([
      getEnergy(),
      getCompletedNodeIds(),
      getStarsByNode(),
    ]);

    if (!mountedRef.current) return;

    setEnergy(energyData);
    setCompleted(completedData);
    setStars(starsData);
  }, []);

  const loadChallenges = useCallback(async () => {
    const data = await getChallengesWithProgress();

    if (!mountedRef.current) return;

    setChallenges(data);
  }, []);

  const loadData = useCallback(async () => {
    const results = await Promise.allSettled([
      loadStory(),
      loadChallenges(),
    ]);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          index === 0 ? "Story loading error:" : "Challenge loading error:",
          result.reason,
        );
      }
    });

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [loadStory, loadChallenges]);

  useEffect(() => {
    mountedRef.current = true;

    void loadData();

    refreshUser().catch(() => {});

    return () => {
      mountedRef.current = false;
    };
  }, [loadData, refreshUser]);

  /* ------------------------------- Refresh -------------------------------- */

  const onRefresh = useCallback(async () => {
    if (refreshLockRef.current) return;

    refreshLockRef.current = true;
    setRefreshing(true);

    try {
      await Promise.all([
        loadData(),
        refreshUser().catch(() => {}),
      ]);
    } finally {
      refreshLockRef.current = false;

      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadData, refreshUser]);

  /* --------------------------- Challenge claims -------------------------- */

  const handleClaim = useCallback(
    async (challenge: ChallengeProgress) => {
      if (claimingRef.current.has(challenge.id)) return;

      claimingRef.current.add(challenge.id);
      setClaimingId(challenge.id);

      try {
        const result = await claimChallenge(challenge);

        if (result.success) {
          showToast(`+${challenge.reward} XP claimed!`, "success");

          await loadChallenges();

          refreshUser().catch(() => {});
        } else {
          showToast("Already claimed", "info");

          await loadChallenges();
        }
      } catch (error) {
        console.error("Challenge claim error:", error);
        showToast("Could not claim reward", "error");
      } finally {
        claimingRef.current.delete(challenge.id);

        if (mountedRef.current) {
          setClaimingId(null);
        }
      }
    },
    [loadChallenges, refreshUser, showToast],
  );

  /* ------------------------------- Story flow ----------------------------- */

  const openLevel = useCallback((level: StoryLevel) => {
    dialogueRef.current?.present(level);
  }, []);

  const beginPuzzle = useCallback((level: StoryLevel) => {
    requestAnimationFrame(() => {
      puzzleRef.current?.present(level);
    });
  }, []);

  const handleSolved = useCallback(
    async (reward: number) => {
      showToast(
        `+${reward} XP — the verse is restored!`,
        "success",
      );

      await Promise.allSettled([
        loadStory(),
        refreshUser(),
      ]);
    },
    [loadStory, refreshUser, showToast],
  );

  /* ----------------------------- Derived state --------------------------- */

  const period = getChallengePeriod();

  const progressPct = getStoryProgress(completed);
  const rank = getGameRank(completed.size);

  const totalStars = useMemo(
    () => Object.values(stars).reduce((total, value) => total + value, 0),
    [stars],
  );

  const listData = section === "challenges" ? challenges : [];

  /* ------------------------------- Loading -------------------------------- */

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
       

        <ActivityIndicator
          color={accent}
          size="small"
          style={{ marginTop: 16 }}
        />

        <Text className="text-tertiary text-[11px] font-sora mt-3">
          Preparing your journey...
        </Text>
      </View>
    );
  }

  /* ----------------------------- Header content -------------------------- */

  const renderHeader = () => (
    <View>
      <ArenaHeader
        section={section}
        onSectionChange={setSection}
        rightMeta={
          section === "challenges" ? period : "Zoe's Journey"
        }
      />

      {section === "journey" ? (
        <View className="pt-5">
          
          {/* Progress */}
          <StoryProgressCard
            progressPct={progressPct}
            rankTitle={rank.title}
            nextRank={rank.next}
            levelsDone={completed.size}
            levelsTotal={LEVELS.length}
            totalStars={totalStars}
            maxStars={LEVELS.length * 3}
          />

          {/* Energy */}
          <View className="mt-3 mb-6">
            

            <EnergyBar
              energy={energy.energy}
              maxEnergy={energy.maxEnergy}
            />
          </View>

         
          

          {/* Story map */}
          <StoryMap
            completed={completed}
            stars={stars}
            energy={energy.energy}
            onNodePress={openLevel}
          />

          
         
        </View>
      ) : (
        <View className="pt-5 pb-4">
          <Text className="text-primary text-[23px] font-sora-bold">
            Challenges
          </Text>

          <Text className="text-tertiary text-[11px] font-sora mt-1">
            Small victories. Meaningful growth.
          </Text>

          <View className="flex-row items-center mt-4">
            <Trophy size={14} color="#E5A93D" />

            <Text className="text-secondary text-[10px] font-sora ml-2">
              Complete your missions and collect XP rewards.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  /* ------------------------------- Challenges ---------------------------- */

  const renderChallenge = ({
    item,
  }: {
    item: ChallengeProgress;
  }) => (
    <ChallengeCard
      item={item}
      claiming={claimingId === item.id}
      onClaim={() => handleClaim(item)}
    />
  );

  const renderEmpty = () => {
    if (section !== "challenges") return null;

    return (
      <View className="items-center justify-center py-16 px-8">
        <Sparkles size={23} color={accent} />

        <Text className="text-primary text-[14px] font-sora-semibold mt-4">
          No challenges yet
        </Text>

        <Text className="text-tertiary text-[11px] font-sora text-center mt-2 leading-5">
          New opportunities to earn XP will appear here. Keep exploring
          your journey.
        </Text>
      </View>
    );
  };

  /* --------------------------------- Render ------------------------------- */

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: top + 6 }}
    >
      <FlatList<ChallengeProgress>
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderChallenge}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        extraData={claimingId}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 140,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent}
            progressBackgroundColor={
              isDark ? "#18181b" : "#f4f4f5"
            }
          />
        }
        initialNumToRender={5}
        windowSize={7}
      />

      <DialogueSheet
        ref={dialogueRef}
        onBegin={beginPuzzle}
      />

      <PuzzleSheet
        ref={puzzleRef}
        onSolved={handleSolved}
      />
    </View>
  );
}
