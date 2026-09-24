import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import LottieView from "lottie-react-native";
import { Crown, Sparkles, X } from "lucide-react-native";
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { FIRE_STAGES, getFireStageIndex } from "@/constants/levels";

const fire = require("@/assets/lottie/Fire.json");
const crown = require("@/assets/lottie/Crown.json");
const oil = require("@/assets/lottie/Oil.json");
const sparkle = require("@/assets/lottie/Twinkle.json");

const lottieFor = (name: string) => {
  switch (name) {
    case "spark":
      return sparkle;
    case "oil":
      return oil;
    case "fire":
      return fire;
    default:
      return crown;
  }
};

export type SpiritStatusModalHandle = {
  present: () => void;
  dismiss: () => void;
};

interface Props {
  currentLevel: number;
}

const SpiritStatusModal = forwardRef<SpiritStatusModalHandle, Props>(
  function SpiritStatusModal({ currentLevel }, ref) {
    const { isDark } = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["55%", "90%"], []);

    const dismiss = useCallback(() => sheetRef.current?.dismiss(), []);
    useImperativeHandle(ref, () => ({
      present: () => requestAnimationFrame(() => sheetRef.current?.present()),
      dismiss,
    }));

    const currentIndex = getFireStageIndex(currentLevel);
    const current = FIRE_STAGES[currentIndex];
    const next = FIRE_STAGES[currentIndex + 1];

    const iconColor = isDark ? "#fff" : "#0c0c0c";
    const placeholder = isDark ? "#3a3a3a" : "#d9cbb5";

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
        handleIndicatorStyle={{ backgroundColor: placeholder, width: 40 }}
      >
        <BottomSheetView className="flex-1 px-6 pb-8">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-tertiary text-sm font-sora-medium">Altar Fire Status</Text>
              <View
                onTouchEnd={dismiss}
                className="w-8 h-8 rounded-full bg-overlay items-center justify-center"
              >
                <X size={16} color={iconColor} />
              </View>
            </View>

            <View className="mt-4 bg-card-1 rounded-3xl p-4 items-center">
              <LottieView
                source={lottieFor(current.animation)}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
              <Text className="text-primary text-lg font-sora-bold">{current.title}</Text>
              <Text className="text-amber-500 text-xs font-sora-semibold mt-0.5">
                LEVEL {currentLevel} • {current.blurb}
              </Text>
            </View>

            <Text className="text-tertiary text-xs font-sora-semibold mt-5 mb-2">How to advance</Text>
            {next ? (
              <View className="flex-row items-start bg-card-1 rounded-2xl p-3.5 border border-line">
                <View className="w-6 h-6 rounded-full bg-amber-500/10 items-center justify-center mt-0.5">
                  <Sparkles size={12} color="#f59e0b" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-primary text-[13px] font-sora-semibold">{next.title}</Text>
                  <Text className="text-tertiary text-xs font-sora leading-5 mt-0.5">{next.requirement}</Text>
                </View>
              </View>
            ) : (
              <Text className="text-tertiary text-xs font-sora">
                You have reached the highest stage. Amazing!
              </Text>
            )}

            <Text className="text-tertiary text-xs font-sora-semibold mt-5 mb-2">The stages</Text>
            {FIRE_STAGES.map((stage, i) => {
              const isCurrent = i === currentIndex;
              const unlocked = i <= currentIndex;
              return (
                <View
                  key={stage.title}
                  className={`flex-row items-center mb-2.5 bg-card-1 rounded-2xl p-3 ${
                    isCurrent ? "border border-amber-500" : "border border-line"
                  }`}
                >
                  <View className="w-14 h-14 items-center justify-center">
                    <LottieView
                      source={lottieFor(stage.animation)}
                      autoPlay
                      loop
                      style={{ width: 56, height: 56 }}
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text
                      className={`text-[13px] font-sora-semibold ${
                        unlocked ? "text-primary" : "text-tertiary"
                      }`}
                    >
                      {stage.title}
                    </Text>
                    <Text className="text-quaternary text-[10px] font-sora mt-0.5">
                      {stage.requirement}
                    </Text>
                  </View>
                  {isCurrent ? (
                    <Crown size={14} color="#f59e0b" />
                  ) : unlocked ? (
                    <Sparkles size={14} color={iconColor} />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default SpiritStatusModal;
