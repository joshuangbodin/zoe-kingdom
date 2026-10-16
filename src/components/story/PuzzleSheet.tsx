/**
 * PuzzleSheet — hosts one level's puzzle and drives the whole feedback loop.
 *
 * Responsibilities:
 *  - Builds the puzzle session from the level (see `libs/puzzles`).
 *  - Renders the right body for the puzzle kind (see `PuzzleBody`).
 *  - Fires praise bursts on every real piece of progress, tracking a streak so
 *    three good moves in a row escalate the celebration.
 *  - Offers hints (which cost a star) from the JSON-authored hint list.
 *  - On completion calls `solveNode` (spends 2 energy, awards XP, stores stars)
 *    and swaps to the VictoryCard.
 *
 * All puzzle state is local; the sheet reports "solved" upward so the map can
 * refresh, and nothing here touches SQLite except through that one call.
 */

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
import { X } from "lucide-react-native";

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
  /** Fired after a first-time solve so the parent reloads energy/progress. */
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
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["88%"], []);

  const [level, setLevel] = useState<StoryLevel | null>(null);
  const [session, setSession] = useState<PuzzleSession | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResultView | null>(null);

  /**
   * Synchronous mirror of `streak`. The praise pop must fire the instant a move
   * is correct, so we need the next streak value without waiting for a re-render
   * — and React requires state updaters to stay pure (no side effects).
   */
  const streakRef = useRef(0);

  const reset = useCallback((l: StoryLevel | null) => {
    setLevel(l);
    setSession(l ? buildSession(l) : null);
    setHintsUsed(0);
    setMistakes(0);
    setStreak(0);
    streakRef.current = 0;
    setHintText(null);
    setResult(null);
  }, []);

  useImperativeHandle(ref, () => ({
    present: (l) => {
      reset(l);
      requestAnimationFrame(() => sheetRef.current?.present());
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
        width: 42,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }}
      >
        <SheetBody
          level={level}
          session={session}
          result={result}
          isDark={isDark}
          praiseRef={praiseRef}
          onClose={() => sheetRef.current?.dismiss()}
          hintsLeft={MAX_HINTS - hintsUsed}
          hintText={hintText}
          streak={streak}
          mistakes={mistakes}
          onFeedback={(correct: boolean) => {
            if (correct) {
              // The streak lives in a ref too: we need the next value NOW to fire
              // the praise pop, and computing it inside a setStreak updater would
              // call setActive during PraiseBurst's render, which React forbids.
              const next = streakRef.current + 1;
              streakRef.current = next;
              setStreak(next);
              praiseRef.current?.praise(next >= STREAK_AT);
            } else {
              streakRef.current = 0;
              setStreak(0);
              setMistakes((m) => m + 1);
            }
          }}
          onHint={() => {
            if (!session || !level) return;
            if (hintsUsed + 1 > MAX_HINTS) return;
            const hints = (level.puzzle as { hints?: string[] }).hints ?? [];
            setHintText(hints[hintsUsed] ?? hints[hints.length - 1] ?? "Look again…");
            setHintsUsed((n) => n + 1);
            setSession(applyHint(session));
            praiseRef.current?.praise(false);
          }}
          onChange={setSession}
          onSubmit={async () => {
            if (!level) return;
            const res = await solveNode(level, {
              mistakes,
              hintsUsed: hintCount(session ?? ({} as PuzzleSession)),
            });
            if (!res.ok) return;
            const isNew = res.reward > 0;
            setResult({
              stars: res.stars,
              xp: res.reward,
              isNew,
              improved: res.improved,
            });
            if (isNew) onSolved(res.reward);
          }}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

/* ------------------------------- Sheet body -------------------------------- */

/**
 * The sheet's contents, split out so the component above stays a thin shell over
 * one bottom-sheet instance (remounting it would restart its animation).
 */
function SheetBody({
  level,
  session,
  result,
  isDark,
  praiseRef,
  onClose,
  hintsLeft,
  hintText,
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
  streak: number;
  mistakes: number;
  onFeedback: (correct: boolean) => void;
  onHint: () => void;
  onChange: (s: PuzzleSession) => void;
  onSubmit: () => void;
}) {
  const grade = session ? gradeSession(session) : null;
  const chapter = level ? getChapterOfLevel(level.id) : undefined;
  const accent = chapter?.color ?? "#f59e0b";

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
      <View className="flex-row items-start mb-4">
        <View className="flex-1 min-w-0">
          <Text className="text-quaternary text-[9px] font-sora-bold tracking-widest">
            LEVEL {level.index} · {puzzleLabel(session.kind).toUpperCase()}
          </Text>
          <Text className="text-primary text-[18px] font-sora-semibold mt-0.5">
            {level.title}
          </Text>
          {streak >= 2 && (
            <Text className="text-amber-400 text-[10px] font-sora-bold mt-0.5">
              🔥 {streak} in a row
            </Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-full bg-overlay items-center justify-center ml-2"
        >
          <X size={15} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Praise pops render above the puzzle, below the header */}
      <PraiseBurst ref={praiseRef} accent={accent} />

      <PuzzleBody
        session={session}
        level={level}
        accent={accent}
        isDark={isDark}
        hintsLeft={hintsLeft}
        hintText={hintText}
        onHint={onHint}
        onFeedback={onFeedback}
        onChange={onChange}
        onSubmit={onSubmit}
        complete={grade.complete}
      />
    </View>
  );
}
