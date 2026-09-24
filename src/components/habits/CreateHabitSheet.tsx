import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { PencilLine, Sparkles, X } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useToast } from "@/components/Toast";
import {
  CATEGORIES,
  frequencyData,
  getCategoryIcon,
} from "@/constants/habit-data";
import { useTheme } from "@/context/theme-context";
import { createHabit } from "@/libs/sqlite/habits";

export type CreateHabitSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

export type CreateHabitSheetProps = {
  /** Fired after a habit is created so the parent can reload the list. */
  onCreated?: () => Promise<void> | void;
};

const DURATIONS = [1, 2, 3, 5, 10, 15, 20, 30];

const CreateHabitSheet = forwardRef<CreateHabitSheetHandle, CreateHabitSheetProps>(
  function CreateHabitSheet({ onCreated }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { isDark } = useTheme();
    const { showToast } = useToast();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [frequency, setFrequency] = useState("throughout_day");
    const [duration, setDuration] = useState(10);
    const [loading, setLoading] = useState(false);

    const snapPoints = useMemo(() => ["85%", "90%"], []);

    useImperativeHandle(ref, () => ({
      present: () => {
        // Reset transient form state each time so the sheet always opens fresh.
        setTitle("");
        setCategory(CATEGORIES[0]);
        setFrequency("throughout_day");
        setDuration(10);
        requestAnimationFrame(() => sheetRef.current?.present());
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const dismiss = () => sheetRef.current?.dismiss();

    const handleCreate = async () => {
      if (!title.trim() || loading) return;
      setLoading(true);
      try {
        await createHabit({
          title: title.trim(),
          category: category.id,
          icon: category.icon,
          color: category.color,
          frequency: frequency as any,
          duration,
        });
        showToast("Habit created!", "success");
        dismiss();
        await onCreated?.();
      } catch (err) {
        console.log(err);
        showToast("Failed to create habit", "error");
      } finally {
        setLoading(false);
      }
    };

    const accent = isDark ? "#ffffff" : "#0c0c0c";
    const iconColor = isDark ? "#ffffff" : "#0c0c0c";

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
          width: 42,
        }}
      >
        <BottomSheetView className="flex-1 px-5 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
             
             
               
                <Text className="text-primary text-lg font-sora-semibold leading-6">
                  New Spiritual Habit
                </Text>
              
            </View>
            <Pressable
              onPress={dismiss}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
            >
              <X size={17} color={iconColor} />
            </Pressable>
          </View>

        

          {/* Scrollable form body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
            className="flex-1 mt-6 -mx-5 px-5"
          >
            {/* Title */}
            <Text className="text-primary text-xs font-sora-medium mb-2">
              What are you practicing?
            </Text>
            <View className="flex-row items-center rounded-2xl bg-card-2  px-3.5 mb-6">
              <PencilLine size={15} color={isDark ? "#71717a" : "#a1a1aa"} />
              <BottomSheetTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Morning prayer…"
                placeholderTextColor={isDark ? "#555" : "#a1a1aa"}
                autoCorrect={false}
                returnKeyType="done"
                className="flex-1 px-3 py-3.5 text-primary text-sm font-sora"
                style={{ color: isDark ? "#ffffff" : "#0c0c0c" }}
              />
            </View>

            {/* Category */}
            <Text className="text-primary text-xs font-sora-medium mb-2.5">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2.5 mb-6">
              {CATEGORIES.map((cat) => {
                const active = category.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat)}
                    className="py-2.5 px-2.5 rounded-full "
                    style={{
                      backgroundColor: active
                        ? isDark
                          ? cat.color + "56"
                          : cat.color + "1f"
                        : isDark
                          ? "#171616"
                          : "#fdfdf6",
                      borderColor: active
                        ? cat.color
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-2"
                        style={{ backgroundColor: cat.color }}
                      >
                        {getCategoryIcon(cat.id, 14, "#ffffff")}
                      </View>
                      <Text
                        className={`text-xs font-sora-semibold ${
                          active ? "text-primary" : "text-secondary"
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Frequency */}
            <Text className="text-primary text-xs font-sora-medium mb-2.5">
              How often will this be done?
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {frequencyData.map((f) => {
                const active = frequency === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFrequency(f.id as any)}
                    className="px-5 py-3 rounded-full "
                    style={{
                      backgroundColor: active
                        ? isDark
                          ? "#ffffff"
                          : "#0c0c0c"
                        : isDark
                          ? "#171616"
                          : "#fdfdf6",
                      borderColor: active
                        ? "transparent"
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <Text
                      className={`text-[11px] font-sora-medium ${
                        active
                          ? isDark
                            ? "text-[#0c0c0c]"
                            : "text-[#ffffff]"
                          : "text-secondary"
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Duration */}
            <Text className="text-primary text-xs font-sora-medium mb-2.5">
              How long each time?
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
              {DURATIONS.map((min) => {
                const active = duration === min;
                return (
                  <Pressable
                    key={min}
                    onPress={() => setDuration(min)}
                    className="px-4.5 py-3 rounded-full "
                    style={{
                      backgroundColor: active
                        ? isDark
                          ? "#ffffff"
                          : "#0c0c0c"
                        : isDark
                          ? "#171616"
                          : "#fdfdf6",
                      borderColor: active
                        ? "transparent"
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <Text
                      className={`text-[11px] font-sora-medium ${
                        active
                          ? isDark
                            ? "text-[#0c0c0c]"
                            : "text-[#ffffff]"
                          : "text-secondary"
                      }`}
                    >
                      {min}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Sticky footer CTA */}
          <Pressable
            onPress={handleCreate}
            disabled={loading || !title.trim()}
            className="mt-2 rounded-2xl items-center"
            style={{
              backgroundColor: accent,
              opacity: loading || !title.trim() ? 0.55 : 1,
            }}
          >
            {loading ? (
              <View className="py-3.5">
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#0c0c0c" : "#ffffff"}
                />
              </View>
            ) : (
              <Text
                className="text-[14px] font-sora-semibold my-3.5"
                style={{ color: isDark ? "#0c0c0c" : "#ffffff" }}
              >
                Create Habit
              </Text>
            )}
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default CreateHabitSheet;