
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  Flame,
  Lightbulb,
  Target,
  X,
} from "lucide-react-native";

import { useTheme } from "@/context/theme-context";
import { FEEDBACK, getChapterOfLevel, type StoryLevel } from "@/data/story";
import {
  applyHint,
  buildSession,
  gradeSession,
  hintCount,
  type PuzzleSession,
} from "@/libs/puzzles";
import { solveNode } from "@/libs/sqlite/story";

import PuzzleBody, { puzzleLabel } from "./PuzzleBody";
import PraiseBurst, { type PraiseBurstHandle } from "./PraiseBurst";
import VictoryCard from "./VictoryCard";

export type PuzzleSheetHandle = {
  present: (level: StoryLevel) => void;
  dismiss: () => void;
};

type Props = {
  onSolved: (reward: number) => void;
};

type SolveResultView = {
  stars: number;
  xp: number;
  isNew: boolean;
  improved: boolean;
};

const MAX_HINTS = 2;
const STREAK_AT = FEEDBACK.streakThreshold as number;

export default forwardRef<PuzzleSheetHandle, Props>(function PuzzleSheet(
  { onSolved },
  ref,
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const praiseRef = useRef<PraiseBurstHandle>(null);
  const submitLockRef = useRef(false);

  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ["88%"], []);

  const [level, setLevel] = useState<StoryLevel | null>(null);
  const [session, setSession] = useState<PuzzleSession | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintActive, setHintActive] = useState(false);
  const [result, setResult] = useState<SolveResultView | null>(null);

  const streakRef = useRef(0);

  const reset = useCallback((nextLevel: StoryLevel | null) => {
    submitLockRef.current = false;

    setLevel(nextLevel);
    setSession(nextLevel ? buildSession(nextLevel) : null);
    setHintsUsed(0);
    setMistakes(0);
    setStreak(0);

    streakRef.current = 0;

    setHintText(null);
    setHintActive(false);
    setResult(null);
  }, []);

  useImperativeHandle(ref, () => ({
    present: (nextLevel) => {
      reset(nextLevel);
      requestAnimationFrame(() => sheetRef.current?.present());
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleFeedback = useCallback((correct: boolean) => {
    if (correct) {
      const next = streakRef.current + 1;

      streakRef.current = next;
      setStreak(next);

      praiseRef.current?.praise(next >= STREAK_AT);
      return;
    }

    streakRef.current = 0;
    setStreak(0);
    setMistakes((current) => current + 1);
  }, []);

  const handleHint = useCallback(() => {
    if (!session || !level || hintsUsed >= MAX_HINTS) return;

    const hints = (level.puzzle as { hints?: string[] }).hints ?? [];
    const nextHint =
      hints[hintsUsed] ?? hints[hints.length - 1] ?? "Look again…";

    setHintText(nextHint);
    setHintsUsed((current) => current + 1);
    setHintActive(true);
    setSession(applyHint(session));

    praiseRef.current?.praise(false);
  }, [session, level, hintsUsed]);

  const handleChange = useCallback((nextSession: PuzzleSession) => {
    setHintActive(false);
    setSession(nextSession);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!level || !session || submitLockRef.current) return;

    submitLockRef.current = true;

    try {
      const response = await solveNode(level, {
        mistakes,
        hintsUsed: hintCount(session),
      });

      if (!response.ok) {
        submitLockRef.current = false;
        return;
      }

      const isNew = response.reward > 0;

      setResult({
        stars: response.stars,
        xp: response.reward,
        isNew,
        improved: response.improved,
      });

      if (isNew) {
        onSolved(response.reward);
      }
    } catch {
      submitLockRef.current = false;
    }
  }, [level, session, mistakes, onSolved]);

  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableHandlePanningGesture={false}
      enableContentPanningGesture={false}
      enableDynamicSizing={false}
      backgroundStyle={{
        backgroundColor: isDark ? "#121111" : "#F5F5F1",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#3A3A3A" : "#C8C9C0",
        width: 38,
        height: 4,
      }}
    >
      <BottomSheetScrollView
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: insets.bottom + 28,
        }}
      >
        <SheetBody
          level={level}
          session={session}
          result={result}
          isDark={isDark}
          praiseRef={praiseRef}
          onClose={handleClose}
          hintsLeft={MAX_HINTS - hintsUsed}
          hintText={hintText}
          hintActive={hintActive}
          streak={streak}
          mistakes={mistakes}
          onFeedback={handleFeedback}
          onHint={handleHint}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

/* -------------------------------- Sheet body ------------------------------- */

function SheetBody({
  level,
  session,
  result,
  isDark,
  praiseRef,
  onClose,
  hintsLeft,
  hintText,
  hintActive,
  streak,
  mistakes,
  onFeedback,
  onHint,
  onChange,
  onSubmit,
}: {
  level: StoryLevel | null;
  session: PuzzleSession | null;
  result: SolveResultView | null;
  isDark: boolean;
  praiseRef: React.RefObject<PraiseBurstHandle | null>;
  onClose: () => void;
  hintsLeft: number;
  hintText: string | null;
  hintActive: boolean;
  streak: number;
  mistakes: number;
  onFeedback: (correct: boolean) => void;
  onHint: () => void;
  onChange: (session: PuzzleSession) => void;
  onSubmit: () => void;
}) {
  const grade = session ? gradeSession(session) : null;
  const chapter = level ? getChapterOfLevel(level.id) : undefined;
  const accent = chapter?.color ?? "#66765B";

  if (!level || !session || !grade) return <View />;

  if (result) {
    return (
      <VictoryCard
        stars={result.stars}
        xp={result.xp}
        isNew={result.isNew}
        improved={result.improved}
        reveal={(level.puzzle as { reveal: string }).reveal}
        reference={(level.puzzle as { reference?: string }).reference ?? ""}
        accent={accent}
        onDone={onClose}
      />
    );
  }

  return (
    <View>
      {/* level header */}
      <View className="mb-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 min-w-0 pr-4">
            <View className="flex-row items-center mb-2">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: accent }}
              />

              <Text
                className="text-[10px] font-sora-bold tracking-[1.8px]"
                style={{ color: accent }}
              >
                LEVEL {level.index}
              </Text>

              <Text className="text-quaternary text-[10px] mx-2">/</Text>

              <Text className="text-tertiary text-[10px] font-sora-medium tracking-wider">
                {puzzleLabel(session.kind).toUpperCase()}
              </Text>
            </View>

            <Text
              className="text-primary text-[23px] font-sora-bold leading-[30px]"
              numberOfLines={2}
            >
              {level.title}
            </Text>

            <Text className="text-tertiary text-[11px] font-sora mt-1">
              Take your time. Think it through.
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close puzzle"
            className="w-10 h-10 rounded-2xl items-center justify-center border"
            style={{
              backgroundColor: isDark ? "#1C1A1A" : "#ECEDE7",
              borderColor: isDark
                ? "rgba(255,255,255,0.07)"
                : "rgba(55,65,52,0.08)",
            }}
          >
            <X size={17} color={isDark ? "#C7C7C7" : "#626A60"} />
          </Pressable>
        </View>

        {/* activity indicators */}
        <View
          className="flex-row items-center mt-4 rounded-2xl px-3 py-3 border"
          style={{
            backgroundColor: isDark ? "#1C1A1A" : "#ECEDE7",
            borderColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(55,65,52,0.07)",
          }}
        >
          <View className="flex-1 flex-row items-center">
            <View
              className="w-7 h-7 rounded-xl items-center justify-center mr-2"
              style={{
                backgroundColor:
                  streak >= 2 ? "rgba(245,158,11,0.14)" : "rgba(150,155,144,0.12)",
              }}
            >
              <Flame
                size={14}
                color={streak >= 2 ? "#F59E0B" : "#969B90"}
              />
            </View>

            <View>
              <Text className="text-primary text-[11px] font-sora-bold">
                {streak}
              </Text>
              <Text className="text-tertiary text-[9px] font-sora">
                Streak
              </Text>
            </View>
          </View>

          <View
            className="w-px h-7"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(55,65,52,0.10)",
            }}
          />

          <View className="flex-1 flex-row items-center justify-center">
            <View
              className="w-7 h-7 rounded-xl items-center justify-center mr-2"
              style={{ backgroundColor: "rgba(239,68,68,0.10)" }}
            >
              <AlertCircle size={14} color="#E87979" />
            </View>

            <View>
              <Text className="text-primary text-[11px] font-sora-bold">
                {mistakes}
              </Text>
              <Text className="text-tertiary text-[9px] font-sora">
                Mistakes
              </Text>
            </View>
          </View>

          <View
            className="w-px h-7"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(55,65,52,0.10)",
            }}
          />

          <View className="flex-1 flex-row items-center justify-end">
            <View
              className="w-7 h-7 rounded-xl items-center justify-center mr-2"
              style={{ backgroundColor: accent + "20" }}
            >
              <Lightbulb size={14} color={accent} />
            </View>

            <View>
              <Text className="text-primary text-[11px] font-sora-bold">
                {hintsLeft}
              </Text>
              <Text className="text-tertiary text-[9px] font-sora">
                Hints left
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* puzzle section */}
      <View>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Target size={13} color={accent} />
            <Text className="text-secondary text-[10px] font-sora-bold tracking-[1.5px] ml-2">
              YOUR CHALLENGE
            </Text>
          </View>

          {streak >= 2 && (
            <View
              className="flex-row items-center rounded-full px-2.5 py-1"
              style={{ backgroundColor: "rgba(245,158,11,0.12)" }}
            >
              <Flame size={11} color="#F59E0B" />
              <Text className="text-amber-500 text-[9px] font-sora-bold ml-1.5">
                {streak} IN A ROW
              </Text>
            </View>
          )}
        </View>

        <PraiseBurst ref={praiseRef} accent={accent} />

        <PuzzleBody
          session={session}
          level={level}
          accent={accent}
          isDark={isDark}
          hintsLeft={hintsLeft}
          hintText={hintText}
          hintActive={hintActive}
          onHint={onHint}
          onFeedback={onFeedback}
          onChange={onChange}
          onSubmit={onSubmit}
          complete={grade.complete}
        />
      </View>
    </View>
  );
}
