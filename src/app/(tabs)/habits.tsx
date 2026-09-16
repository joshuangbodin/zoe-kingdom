import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "react-native-pressable-scale";

import { createHabit, getHabits } from "@/libs/sqlite/habits";

import BibleModal from "@/components/BibleModal";
import HabitCard from "@/components/habits/HabitCard";
import { useToast } from "@/components/Toast";
import { DAILY_VERSES } from "@/constants/dailyverse";
import {
  CATEGORIES,
  frequencyData,
  getCategoryIcon,
} from "@/constants/habit-data";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";

const getDailyVerse = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now.getTime() - start.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
};

export default function Habits() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const { habits, setHabits } = useApp();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");

  const [duration, setDuration] = useState(10);

  const [remindEnabled, setRemindEnabled] = useState(false);
  const [remindHour, setRemindHour] = useState(8);
  const [remindMin, setRemindMin] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const [frequency, setFrequency] = useState<
    "morning" | "evening" | "twice_daily" | "weekly" | "throughout_day"
  >("throughout_day");

  const [filterFrequency, setFilterFrequency] = useState("All");
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const [bibleModalVerse, setBibleModalVerse] = useState<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);

  // LOAD
  const loadHabits = async () => {
    const data = await getHabits();
    setHabits(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, []),
  );

  // FILTER
  const filteredHabits = useMemo(() => {
    if (filterFrequency.toLowerCase() === "all") {
      return habits;
    }

    return habits.filter(
      (h: any) => h.frequency?.toLowerCase() === filterFrequency.toLowerCase(),
    );
  }, [habits, filterFrequency]);

  // REFRESH
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, []);

  // CREATE
  const handleCreateHabit = async () => {
    if (!title.trim()) return;

    try {
      setLoading(true);

      await createHabit({
        title,
        category: selectedCategory.id,
        icon: selectedCategory.icon,
        color: selectedCategory.color,
        frequency,
        duration,
        remindEnabled: remindEnabled ? 1 : 0,
        remindAt: remindEnabled
          ? `${String(remindHour).padStart(2, "0")}:${String(remindMin).padStart(2, "0")}`
          : null,
      });

      setTitle("");
      setRemindEnabled(false);
      setOpen(false);
      showToast("Habit created!", "success");

      await loadHabits();
    } catch (err) {
      console.log(err);
      showToast("Failed to create habit", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
      {/* HEADER */}
      <View className="px-5 flex-row items-center justify-between mb-2">
        <View>
          <Text className="text-primary text-base font-sora-semibold">
            Your Spiritual Habits
          </Text>
        </View>

        <PressableScale
          activeScale={0.9}
          onPress={() => setOpen(true)}
          className="w-9 h-9 rounded-full items-center justify-center bg-overlay"
        >
          <Plus color={isDark ? "white" : "black"} size={18} />
        </PressableScale>
      </View>

      {/* CONTENT */}
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 140,
        }}
        ListHeaderComponent={
          <>
            {/* Daily Scripture Card */}
            {(() => {
              const dailyVerse = getDailyVerse();
              const val = Math.floor(Math.random() * 3) ;

              const src = [
                require(`@/assets/images/bgs/bg-1.png`),
                require(`@/assets/images/bgs/bg-2.png`),
                require(`@/assets/images/bgs/bg-3.png`),
              ];

              return (
                <View className="rounded-3xl overflow-hidden mb-6">
                  {/* Absolute pattern fills the card; content sits above it */}
                  <Image
                    source={src[val]}
                    className="absolute inset-0   w-full h-full"
                    style={{ borderRadius: 24 }}
                    resizeMode="cover"
                  />

                  {/* Pattern overlaid with the card surface color so text stays readable */}
                  <View className="bg-bg/60 p-5 pb-12">
                    <Text className="text-primary/80 text-[10px] font-sora ">
                      {dailyVerse.ref}
                    </Text>
                    <Text
                      numberOfLines={3}
                      className="text-primary text-xs font-serif leading-5 mt-2"
                    >
                      {dailyVerse.text}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setBibleModalVerse({
                        book: dailyVerse.book,
                        chapter: dailyVerse.chapter,
                        verse: dailyVerse.verse,
                      });
                      setShowBibleModal(true);
                    }}
                    className="absolute bottom-0 right-0 bg-accent px-4 py-2 rounded-tl-2xl"
                  >
                    <Text className="text-bg text-[10px] font-sora-semibold">
                      Read full
                    </Text>
                  </Pressable>
                </View>
              );
            })()}

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row items-center">
                {[{ label: "All" }, ...frequencyData].map(
                  (item: any, index) => {
                    const active =
                      item.label.toLowerCase() ===
                      filterFrequency.toLowerCase();

                    return (
                      <Pressable
                        key={index}
                        onPress={() => setFilterFrequency(item.label)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          active ? "bg-white" : "bg-card-1"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-sora-medium ${
                            active ? "text-black" : "text-secondary"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          <View className="items-center mt-24">
            <Text className="text-primary/60 text-sm font-sora-semibold">
              No Habits Yet
            </Text>
            <Text className="text-tertiary text-center mt-2 px-10 text-xs font-sora leading-5">
              Create your first spiritual habit and begin growing consistently.
            </Text>
          </View>
        }
        renderItem={({ item }: any) => <HabitCard item={item} />}
      />

      {/* FAB */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-6 right-5 w-11 h-11 rounded-full bg-white items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <Plus color={"black"} size={18} strokeWidth={2.2} />
      </Pressable>

      {/* Create Modal */}
      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-bg rounded-t-4xl px-5 pt-6 pb-10">
            <Text className="text-primary text-sm font-sora-semibold mb-6">
              Create Habit
            </Text>

            {/* Title */}
            <Text className="text-secondary text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">
              Title
            </Text>
            <TextInput
              placeholder="Morning Prayer..."
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
              className="bg-card-1 rounded-xl px-4 py-3.5 text-primary/90 text-sm font-sora border border-line mb-5"
            />

            {/* Category */}
            <Text className="text-secondary text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-4 py-3  rounded-xl  flex-row items-center ${
                      active ? "" : "bg-card-1 "
                    }`}
                    style={{
                      backgroundColor: active ? cat.color + "30" : undefined,
                      borderWidth: 1,
                      borderColor: active
                        ? cat.color
                        : isDark
                          ? "#71717a"
                          : "#e5e7eb",
                    }}
                  >
                    <View className="mr-2">
                      {getCategoryIcon(
                        cat.id,
                        14,
                        active ? cat.color : isDark ? "#71717a" : "#9ca3af",
                      )}
                    </View>
                    <Text className="text-primary/80 text-xs font-sora-medium">
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Frequency */}
            <Text className="text-secondary text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">
              Frequency
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {frequencyData.map((f) => {
                const active = frequency === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFrequency(f.id as any)}
                    className={`px-4 py-2.5 rounded-xl ${
                      active ? "bg-accent" : "bg-card-1"
                    }`}
                  >
                    <Text
                      className={`text-xs font-sora-medium ${
                        active ? "text-bg" : "text-primary/70"
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Duration */}
            <Text className="text-secondary text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">
              Duration (minutes)
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {[1, 2, 3, 5, 10, 15, 20, 30].map((min) => {
                const active = duration === min;
                return (
                  <Pressable
                    key={min}
                    onPress={() => setDuration(min)}
                    className={`px-4 py-2.5 rounded-xl ${
                      active ? "bg-accent" : "bg-card-1"
                    }`}
                  >
                    <Text
                      className={`text-xs font-sora-medium ${
                        active ? "text-bg" : "text-primary/70"
                      }`}
                    >
                      {min}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Reminder */}
            <Text className="text-secondary text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">
              Daily reminder
            </Text>
            <View className="flex-row items-center justify-between bg-card-1 rounded-xl px-4 py-3.5 mb-3">
              <View className="flex-1">
                <Text className="text-primary text-[13px] font-sora-semibold">
                  Notify me
                </Text>
                <Text className="text-tertiary text-[10px] font-sora mt-[1px]">
                  {`We'll nudge you at your chosen time`}
                </Text>
              </View>
              <Pressable
                onPress={() => setRemindEnabled(!remindEnabled)}
                className={`w-12 h-7 rounded-full items-center ${
                  remindEnabled
                    ? "bg-accent justify-end"
                    : "bg-overlay justify-start"
                }`}
              >
                <View className="w-5 h-5 rounded-full bg-white ml-0.5 mr-0.5" />
              </Pressable>
            </View>

            {remindEnabled && (
              <>
                {/* Hour */}
                <Text className="text-tertiary text-[10px] font-sora-medium mb-1.5">
                  Hour
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-2.5">
                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(
                    (h) => {
                      const active = remindHour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => setRemindHour(h)}
                          className={`w-9 h-8 rounded-lg items-center ${
                            active ? "bg-accent" : "bg-card-1"
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-sora-medium ${
                              active ? "text-bg" : "text-primary/70"
                            }`}
                          >
                            {h > 12 ? h - 12 : h}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>

                {/* Minute */}
                <Text className="text-tertiary text-[10px] font-sora-medium mb-1.5">
                  Minutes
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {[0, 15, 30, 45].map((m) => {
                    const active = remindMin === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setRemindMin(m)}
                        className={`px-3.5 py-2 rounded-lg ${
                          active ? "bg-accent" : "bg-card-1"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-sora-medium ${
                            active ? "text-bg" : "text-primary/70"
                          }`}
                        >
                          {String(m).padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setOpen(false)}
                className="flex-1 bg-card-2 rounded-xl py-3.5 items-center"
              >
                <Text className="text-primary/70 text-sm font-sora-semibold">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                disabled={loading}
                onPress={handleCreateHabit}
                className="flex-1 bg-accent rounded-xl py-3.5 items-center"
              >
                <Text className="text-bg text-sm font-sora-semibold">
                  {loading ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bible Modal */}
      {bibleModalVerse && (
        <BibleModal
          visible={showBibleModal}
          onClose={() => setShowBibleModal(false)}
          initialBook={bibleModalVerse.book}
          initialChapter={bibleModalVerse.chapter}
          initialVerse={bibleModalVerse.verse}
        />
      )}
    </View>
  );
}
