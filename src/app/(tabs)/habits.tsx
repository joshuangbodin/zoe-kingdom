import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "react-native-pressable-scale";

import { getHabits } from "@/libs/sqlite/habits";

import BibleModal from "@/components/BibleModal";
import CreateHabitSheet, {
  type CreateHabitSheetHandle,
} from "@/components/habits/CreateHabitSheet";
import HabitCard from "@/components/habits/HabitCard";
import { DAILY_VERSES } from "@/constants/dailyverse";
import { frequencyData } from "@/constants/habit-data";
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

  const createSheetRef = useRef<CreateHabitSheetHandle>(null);

  const [filterFrequency, setFilterFrequency] = useState("All");
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bibleModalVerse, setBibleModalVerse] = useState<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);

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
          onPress={() => createSheetRef.current?.present()}
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
        onPress={() => createSheetRef.current?.present()}
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

{/* Create Habit Sheet */}
      <CreateHabitSheet ref={createSheetRef} onCreated={loadHabits} />

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
