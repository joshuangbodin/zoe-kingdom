import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import LottieView from "lottie-react-native";
import { Flame, Sparkles, X } from "lucide-react-native";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";

const fire = require("@/assets/lottie/Fire.json");

/** Streak milestones worth celebrating. */
const STREAK_MILESTONES = [3, 7, 30, 100, 365];

export type StreakProgressModalHandle = {
  present: () => void;
  dismiss: () => void;
};

interface props {
  streak: number;
}

const TIPS = [
  {
    title: "Complete a habit every day",
    body: "Check off at least one habit before midnight so your streak keeps growing.",
  },
  {
    title: "One miss stays as long as you restart",
    body: "Missed a day? Getting back on track today still builds a fresh streak.",
  }
];

const StreakProgressModal = forwardRef<StreakProgressModalHandle, props>(
  function StreakProgressModal({ streak }, ref) {
    const { isDark } = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);

    const snapPoints = useMemo(() => ["62%", "90%"], []);

    const dismiss = useCallback(() => {
      sheetRef.current?.dismiss();
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => {
        requestAnimationFrame(() => sheetRef.current?.present());
      },
      dismiss,
    }));

    const milestone = useMemo(() => {
      const next =
        STREAK_MILESTONES.find((m) => m > streak) ??
        STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
      const percent = Math.min(streak / next, 1);
      const daysToNext = Math.max(next - streak, 0);
      const allReached = streak >= next;
      return { next, percent, daysToNext, allReached };
    }, [streak]);

    const iconColor = isDark ? "#fff" : "#0c0c0c";
    const placeholderColor = isDark ? "#3a3a3a" : "#d4d4d8";

    const heroMessage =
      streak === 0
        ? "Complete your first habit today to light the flame."
        : milestone.allReached
          ? "Amazing! You've reached every streak milestone. 🔥"
          : `${milestone.daysToNext} more day${
              milestone.daysToNext === 1 ? "" : "s"
            } to your next milestone.`;

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#ffffff" }}
        handleIndicatorStyle={{ backgroundColor: placeholderColor, width: 40 }}
      >
        <BottomSheetView className="flex-1 px-6 pb-8">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-tertiary text-[11px] font-sora-semibold uppercase tracking-widest">
                Streak Progress
              </Text>
              <View
                onTouchEnd={dismiss}
                className="w-8 h-8 rounded-full bg-overlay items-center justify-center"
              >
                <X size={16} color={iconColor} />
              </View>
            </View>

            {/* Hero */}
            <View className="items-center my-4">
              <View className="w-27.5 h-27.5 rounded-full bg-amber-500/10 border border-amber-500/20 items-center justify-center overflow-hidden">
                <LottieView
                  source={fire}
                  autoPlay
                  loop
                  style={{ width: 96, height: 96 }}
                />
              </View>
              <View className="flex-row items-end mt-2.5">
                <Flame size={26} color="#f59e0b" />
                <Text className="text-primary text-5xl font-sora-bold ml-2 leading-none">
                  {streak}
                </Text>
              </View>
              <Text className="text-secondary text-[11px] font-sora-medium tracking-widest mt-1.5">
                DAY{streak === 1 ? "" : "S"} STREAK
              </Text>
              <Text className="text-tertiary text-xs font-sora text-center mt-3 max-w-70 leading-5">
                {heroMessage}
              </Text>
            </View>
            {/* Next milestone */}
            <View className="bg-card-2 rounded-3xl p-5 border border-line">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-muted text-[10px] font-sora-semibold uppercase tracking-widest">
                  Next milestone
                </Text>
                {milestone.allReached ? (
                  <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-500/15">
                    <Sparkles size={12} color="#10b981" />
                    <Text className="text-emerald-500 text-[11px] font-sora-semibold ml-1">
                      Complete
                    </Text>
                  </View>
                ) : (
                  <Text className="text-primary text-xs font-sora-semibold">
                    {milestone.daysToNext} day
                    {milestone.daysToNext === 1 ? "" : "s"} to {milestone.next}
                  </Text>
                )}
              </View>

              <View className="relative h-2 bg-overlay overflow-hidden rounded-full">
                <View
                  style={{ width: `${milestone.percent * 100}%` }}
                  className="absolute bg-amber-500 rounded-full h-full left-0"
                />
              </View>

              {/* Milestone badges */}
              <View className="flex-row items-center justify-between mt-4">
                {STREAK_MILESTONES.map((m) => {
                  const passed = streak >= m;
                  return (
                    <View key={m} className="items-center gap-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          passed
                            ? "bg-amber-500"
                            : "bg-overlay border border-line"
                        }`}
                      >
                        <Flame
                          size={14}
                          color={passed ? "#0c0c0c" : iconColor}
                        />
                      </View>
                      <Text
                        className={`text-[10px] font-sora-semibold ${
                          passed ? "text-amber-500" : "text-tertiary"
                        }`}
                      >
                        {m}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* How to keep it alive */}
            <View className="mt-4">
              <Text className="text-tertiary text-[10px] font-sora-semibold uppercase tracking-widest mb-2.5">
                Keep the flame burning
              </Text>
              {TIPS.map((tip, i) => (
                <View
                  key={i}
                  className="flex-row items-start mb-2.5 bg-card-1 rounded-2xl p-3.5 border border-line"
                >
                  <View className="w-6 h-6 rounded-full bg-amber-500/10 items-center justify-center mt-0.5">
                    <Flame size={12} color="#f59e0b" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-primary text-[13px] font-sora-semibold">
                      {tip.title}
                    </Text>
                    <Text className="text-tertiary text-xs font-sora leading-5 mt-0.5">
                      {tip.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default StreakProgressModal;
