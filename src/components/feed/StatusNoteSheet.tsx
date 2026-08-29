import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";

import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import Avatar from "@/components/Avatar";
import { getStoryColor } from "@/constants/feed";
import { useTheme } from "@/context/theme-context";

export type StatusNoteSheetHandle = {
  present: (user: { uid?: string; username?: string; avatar?: number; statusNote?: string }) => void;
  dismiss: () => void;
};

/**
 * Slidable bottom sheet that shows a user's status note. It keeps its own
 * local copy of the selected user so the feed screen doesn't have to store it.
 */
const StatusNoteSheet = forwardRef<StatusNoteSheetHandle>(
  function StatusNoteSheet(_, ref) {
    const { isDark } = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [user, setUser] = useState<{ uid?: string; username?: string; avatar?: number; statusNote?: string } | null>(null);

    const snapPoints = useMemo(() => ["42%"], []);
    const color = getStoryColor(user?.uid);

    useImperativeHandle(ref, () => ({
      present: (u) => {
        setUser(u);
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
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#ffffff" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d4d4d8",
          width: 40,
        }}
      >
        <BottomSheetView className="flex-1 px-6 pb-8">
          {user && (
            <>
              {/* Header row */}
              <View className="flex-row items-center justify-between">
                <Text className="text-tertiary text-[11px] font-sora-semibold uppercase tracking-widest">
                  Status Note
                </Text>
                <Pressable
                  onPress={dismiss}
                  className="w-8 h-8 rounded-full bg-overlay items-center justify-center"
                  hitSlop={8}
                >
                  <X size={16} color="#888" />
                </Pressable>
              </View>

              {/* Hero */}
              <View className="items-center my-6">
                <View
                  className="w-[92px] h-[92px] rounded-full items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  <View className="w-[84px] h-[84px] rounded-full bg-bg p-[3px]">
                    <Avatar index={user.avatar ?? 0} diameter={76} />
                  </View>
                </View>
                <Text className="text-primary text-sm font-sora-semibold mt-3">
                  @{user.username ?? "user"}
                </Text>
              </View>

              {/* Quote */}
              <View className="bg-card-2 rounded-3xl px-6 py-6 border border-line">
                <Text className="text-amber-400/70 text-[10px] font-sora-semibold uppercase tracking-widest mb-2 text-center">
                  “Today I’m leaning on…”
                </Text>
                <Text className="text-primary text-base font-serif leading-7 text-center">
                  “{user.statusNote}”
                </Text>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default StatusNoteSheet;