import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Updates from "expo-updates";
import { Download, RotateCcw, Sparkles, X } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ActivityIndicator, AppState, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/theme-context";

/**
 * Global update manager.
 *
 * Silently checks for a new OTA update when the app starts, whenever it returns
 * to the foreground, and every few minutes while online. When an update is found
 * it opens a bottom sheet asking the user to accept it. Accepting downloads the
 * update (`fetchUpdateAsync`) and then offers a "Restart now" action
 * (`reloadAsync`) to apply it.
 *
 * Mounted once in `_layout.tsx` inside the `BottomSheetModalProvider`.
 */

const CHECK_INTERVAL_MS = 3 * 60 * 1000; // every ~3 minutes

export default function UpdatesSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending,
    isDownloading,
    availableUpdate,
  } = Updates.useUpdates();

  // Only auto-present each state once so we don't nag on every re-render.
  const shownAvailable = useRef(false);
  const shownPending = useRef(false);

  const snapPoints = useMemo(() => ["46%"], []);

  const present = useCallback(() => {
    requestAnimationFrame(() => sheetRef.current?.present());
  }, []);

  const dismiss = useCallback(() => sheetRef.current?.dismiss(), []);
// Present the sheet when a new update is discovered (installable first, then
  // restart once it downloaded and is pending).
  useEffect(() => {
    if (isUpdatePending && !shownPending.current) {
      shownPending.current = true;
      present();
    } else if (isUpdateAvailable && !shownAvailable.current) {
      shownAvailable.current = true;
      present();
    }
  }, [isUpdateAvailable, isUpdatePending, present]);

  // Silent update checks: once at launch, when returning to foreground, and on a
  // gentle interval. Offline / dev failures are intentionally swallowed.
  useEffect(() => {
    const check = async () => {
      try {
        await Updates.checkForUpdateAsync();
      } catch {
        /* silent – offline or disabled */
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  const handleInstall = useCallback(async () => {
    try {
      await Updates.fetchUpdateAsync();
      // Once downloaded, `isUpdatePending` flips true and the sheet swaps to
      // the "Restart now" state.
    } catch {
      /* keep the sheet open so the user can retry */
    }
  }, []);

  const handleRestart = useCallback(() => {
    Updates.reloadAsync();
  }, []);

  const updatedAt = availableUpdate?.createdAt;
  const runningVersion = currentlyRunning.runtimeVersion;

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
          <View className="w-11 h-11 rounded-2xl bg-amber-500/15 items-center justify-center">
            <Sparkles size={20} color="#f59e0b" />
          </View>
          <Pressable
            onPress={dismiss}
            hitSlop={8}
            className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
          >
            <X size={17} color={isDark ? "#fff" : "#0c0c0c"} />
          </Pressable>
        </View>

        <Text className="text-primary text-xl font-sora-bold leading-7">
          {isUpdatePending ? "Update ready to install" : "A new update is here"}
        </Text>
        <Text className="text-secondary text-[13px] font-sora mt-1.5 leading-5">
          {isUpdatePending
            ? "Your fresh build has finished downloading. Restart to apply the latest improvements."
            : "Download the latest improvements to your faith journey and restart to apply them."}
        </Text>

        {isDownloading && (
          <View className="flex-row items-center mt-5 rounded-2xl bg-card-2 px-4 py-3">
            <ActivityIndicator size="small" color="#f59e0b" />
            <Text className="text-tertiary text-xs font-sora-medium ml-3">
              Downloading update…
            </Text>
          </View>
        )}

        {!isDownloading && (
          <View className="mt-5 rounded-2xl bg-card-2 px-4 py-3 flex-row items-center">
            <Text className="text-quaternary text-[10px] font-sora-medium uppercase tracking-wide flex-1">
              {updatedAt
                ? `Available ${updatedAt.toLocaleDateString()}`
                : "What's new"}
            </Text>
            {runningVersion ? (
              <Text className="text-tertiary text-[10px] font-sora tabular-nums">
                v{runningVersion}
              </Text>
            ) : null}
          </View>
        )}

        {/* Actions */}
        <View className="flex-row items-center gap-3 mt-6">
          <Pressable
            onPress={dismiss}
            className="rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: isDark ? "#1f1e1e" : "#ffffff" }}
          >
            <Text className="text-tertiary text-[13px] font-sora-semibold">
              Later
            </Text>
          </Pressable>

          <Pressable
            onPress={isUpdatePending ? handleRestart : handleInstall}
            disabled={isDownloading}
            className="flex-1 flex-row items-center justify-center rounded-2xl bg-white py-3.5"
            style={{ opacity: isDownloading ? 0.6 : 1 }}
          >
            {isUpdatePending ? (
              <RotateCcw size={16} color="#0c0c0c" />
            ) : (
              <Download size={16} color="#0c0c0c" />
            )}
            <Text className="text-black text-[14px] font-sora-semibold ml-2">
              {isUpdatePending ? "Restart now" : "Install update"}
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}