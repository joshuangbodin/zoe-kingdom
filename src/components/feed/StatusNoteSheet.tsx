import { PenLineIcon, X } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import Avatar from "@/components/Avatar";
import { getStoryColor } from "@/constants/feed";
import { useTheme } from "@/context/theme-context";
import { router } from "expo-router";

export type StatusNoteSheetHandle = {
  present: (user: {
    uid?: string;
    username?: string;
    avatar?: number;
    statusNote?: string;
  }) => void;
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
    const [user, setUser] = useState<{
      uid?: string;
      username?: string;
      avatar?: number;
      statusNote?: string;
    } | null>(null);

    const snapPoints = useMemo(() => ["50%"], []);
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
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
          width: 40,
        }}
      >
        <BottomSheetView className="flex-1 px-6 pb-8">
          {user && (
            <>
              {/* Header row */}
              <View className="flex-row items-center justify-between">
                <Text className="text-tertiary text-[11px] font-sora-semibold">
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
                  className="w-23 h-23 rounded-full items-center justify-end"
                  style={{ backgroundColor: color }}
                >
                  <Avatar index={user.avatar ?? 0} diameter={76} />
                </View>
                <Text className="text-primary text-sm font-sora-semibold mt-3">
                  @{user.username ?? "user"}
                </Text>
              </View>

              {/* Quote */}
              <View className="bg-card-2 rounded-3xl px-6 py-6">
                <Text className="text-primary text-base font-serif leading-7 text-center">
                  “{user.statusNote}”
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  dismiss();
                  router.push({
                    pathname: "/sharethought",
                    params: {
                      // Pass primitives only — nested/serialized objects don't
                      // transit reliably through native route params.
                      mentionUid: user?.uid || "",
                      mentionUsername: user?.username || "",
                    },
                  });
                }}
                className="w-full h-13 flex-row gap-3  bg-primary mt-5 justify-center items-center rounded-2xl"
              >
                <PenLineIcon color={isDark ? "#000" : "#fff"} size={16} />
                <Text className="font-sora-medium text-bg text-sm">
                  Share your Take
                </Text>
              </Pressable>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default StatusNoteSheet;
