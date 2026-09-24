import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BookOpen, Check, X } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";

export type VersionSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

const COMING_SOON = [
  { abbr: "NIV", name: "New International Version" },
  { abbr: "ESV", name: "English Standard Version" },
  { abbr: "NKJV", name: "New King James Version" },
  { abbr: "NLT", name: "New Living Translation" },
  { abbr: "NASB", name: "New American Standard Bible" },
  { abbr: "AMP", name: "Amplified Bible" },
];

const VersionSheet = forwardRef<VersionSheetHandle, object>(
  function VersionSheet(_props, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { isDark } = useTheme();
    const snapPoints = useMemo(() => ["55%", "65%"], []);

    const dismiss = () => sheetRef.current?.dismiss();

    useImperativeHandle(ref, () => ({
      present: () => requestAnimationFrame(() => sheetRef.current?.present()),
      dismiss,
    }));

    const iconColor = isDark ? "#ffffff" : "#0c0c0c";

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
          width: 42,
        }}
      >
        <BottomSheetView className="flex-1 px-5 pb-7">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
             
              <View>
                <Text className="text-primary text-lg font-sora-semibold leading-6">
                  Bible Version
                </Text>
                <Text className="text-tertiary text-[11px] font-sora">
                  Choose your translation
                </Text>
              </View>
            </View>
            <Pressable
              onPress={dismiss}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
            >
              <X size={17} color={iconColor} />
            </Pressable>
          </View>

          {/* Active version */}
          <View className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5 mb-4"
            style={{
              backgroundColor: isDark ? "#171616" : "#fdfdf6",
              borderWidth: 1,
              borderColor: "#f59e0b",
            }}
          >
            <View className="w-10 h-10 rounded-2xl bg-amber-500/15 items-center justify-center">
              <Check size={16} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-primary text-sm font-sora-semibold">
                King James Version
              </Text>
              <Text className="text-tertiary text-[11px] font-sora">1611 · KJV</Text>
            </View>
            <View className="bg-amber-500/20 rounded-full px-2.5 py-1">
              <Text className="text-amber-500 text-[10px] font-sora-semibold">
                Active
              </Text>
            </View>
          </View>

          {/* Coming soon */}
          <Text className="text-tertiary text-[12px] font-sora-medium mb-3">
            Other translations are on the way
          </Text>

          {COMING_SOON.map((v) => (
            <View
              key={v.abbr}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3 opacity-45"
              style={{
                backgroundColor: isDark ? "#171616" : "#fdfdf6",
              }}
            >
              <View className="w-8 h-8 rounded-xl bg-card-2 items-center justify-center">
                <Text className="text-tertiary text-[10px] font-sora-semibold uppercase">
                  {v.abbr}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-secondary text-[13px] font-sora-medium">
                  {v.name}
                </Text>
              </View>
              <Text className="text-quaternary text-[10px] font-sora">
                Soon
              </Text>
            </View>
          ))}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default VersionSheet;