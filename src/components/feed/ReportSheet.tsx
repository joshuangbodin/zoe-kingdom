import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Flag, X } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/theme-context";

export type ReportSheetHandle = {
  present: (onSubmit: (reason: string) => void) => void;
  dismiss: () => void;
};

const REASONS = [
  { id: "spam", label: "Spam or scam" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "misinformation", label: "False or misleading" },
  { id: "other", label: "Something else" },
];

/** Bottom sheet that collects a report reason and hands it back to the caller. */
const ReportSheet = forwardRef<ReportSheetHandle>(function ReportSheet(_, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const onSubmitRef = useRef<((reason: string) => void) | null>(null);

  const snapPoints = useMemo(() => ["48%"], []);

  useImperativeHandle(ref, () => ({
    present: (onSubmit) => {
      onSubmitRef.current = onSubmit;
      requestAnimationFrame(() => sheetRef.current?.present());
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const dismiss = () => sheetRef.current?.dismiss();

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
      <BottomSheetView
        className="flex-1 px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-red-500/15 items-center justify-center">
              <Flag size={18} color="#ef4444" />
            </View>
            <View>
              <Text className="text-primary text-lg font-sora-semibold">
                Report post
              </Text>
              <Text className="text-tertiary text-[11px] font-sora">
                Why are you reporting this?
              </Text>
            </View>
          </View>
          <Pressable
            onPress={dismiss}
            className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
            hitSlop={8}
          >
            <X size={17} color={isDark ? "#fff" : "#0c0c0c"} />
          </Pressable>
        </View>

        <View className="gap-2">
          {REASONS.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                const cb = onSubmitRef.current;
                dismiss();
                cb?.(r.label);
              }}
              className="flex-row items-center rounded-2xl px-4 py-3.5"
              style={{
                backgroundColor: isDark ? "#1c1a1a" : "#ffffff",
              }}
            >
              <Text className="text-primary text-[13px] font-sora-medium">
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ReportSheet;