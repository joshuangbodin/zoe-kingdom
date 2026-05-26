import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
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

import { createHabit, getHabits, Habit } from "@/libs/sqlite/habits";

import HabitCard from "@/components/habits/HabitCard";
import {
  CATEGORIES,
  frequencyData,
  getCategoryIcon,
} from "@/constants/habit-data";

export default function Habits() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");

  const [duration, setDuration] = useState(10);

  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const [frequency, setFrequency] = useState<
    "morning" | "evening" | "twice_daily" | "weekly" | "throughout_day"
  >("throughout_day");

  const [filterFrequency, setFilterFrequency] = useState("All");

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
      });

      setTitle("");
      setOpen(false);

      await loadHabits();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        paddingTop: top + 10,
      }}
      className="flex-1 bg-bg"
    >
      {/* HEADER */}
      <View className="px-5 flex-row items-center justify-between">
        <Text className="text-xl  text-white font-sora-bold">
          Your Spiritual Habits
        </Text>

        <PressableScale
          activeScale={0.9}
          onPress={() => setOpen(true)}
          className="w-12 h-12 rounded-2xl items-center justify-center bg-[#151515]"
        >
          <Plus color={"white"} size={28} />
        </PressableScale>
      </View>

      {/* CONTENT */}
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 160,
        }}
        ListHeaderComponent={
          <>
            {/* SCRIPTURE */}
            <View className="bg-card-2 rounded-3xl p-6 pb-12 overflow-hidden">
              <Text className="text-muted text-xs font-sora">
                1 Corinthians 9: 24–27
              </Text>

              <Text className="text-white text-sm font-serif leading-loose mt-3">
                Run in such a way as to get the prize... I discipline my body
                and keep it under control...
              </Text>

              <Pressable className="absolute bottom-0 right-0 bg-[#F3F3F3] px-4 py-2 rounded-tl-3xl">
                <Text className="text-black text-xs font-sora">Read full</Text>
              </Pressable>
            </View>

            {/* FILTERS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-8 mb-5"
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
                        className={`px-4 py-2.5 rounded-full  ${
                          active ? "bg-[#2A2A2D]" : ""
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            active
                              ? "text-white font-sora-medium"
                              : "text-[#A1A1AA]"
                          } font-sora`}
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
          <View className="items-center mt-32">
            <Text className="text-white text-xl font-sora-bold">
              No Habits Yet
            </Text>

            <Text className="text-[#7C7C80] text-center mt-3 px-10 leading-6">
              Create your first spiritual habit and begin growing consistently.
            </Text>
          </View>
        }
        renderItem={({ item }: any) => <HabitCard item={item} />}
      />

      {/* FLOAT BUTTON */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-4 right-5 w-12 h-12 rounded-full bg-[#F5F5F5] items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <Plus color={"black"} size={18} strokeWidth={2.2} />
      </Pressable>

      {/* MODAL */}
      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#111111] rounded-t-[40px] px-6 pt-7">
            <Text className="text-white text-[30px] font-sora-bold">
              Create Habit
            </Text>

            {/* TITLE */}
            <TextInput
              placeholder="Morning Prayer..."
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              className="bg-[#1A1A1A] mt-7 rounded-[28px] px-5 py-5 text-white text-[16px]"
            />

            {/* CATEGORY */}
            <Text className="text-white mt-8 mb-4 text-lg font-sora-semibold">
              Category
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory.id === cat.id;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat)}
                    className="px-5 py-4 rounded-[22px] flex-row items-center"
                    style={{
                      backgroundColor: active ? cat.color : "#1A1A1A",
                    }}
                  >
                    <View className="mr-2">
                      {getCategoryIcon(cat.id, 16, "#fff")}
                    </View>

                    <Text className="text-white font-sora-medium">
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* FREQUENCY */}
            <Text className="text-white mt-8 mb-4 text-lg font-sora-semibold">
              Frequency
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {frequencyData.map((f) => {
                const active = frequency === f.id;

                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFrequency(f.id as any)}
                    className="px-5 py-4 rounded-[22px]"
                    style={{
                      backgroundColor: active ? "#F5F5F5" : "#1A1A1A",
                    }}
                  >
                    <Text
                      className="font-sora-medium"
                      style={{
                        color: active ? "#000" : "#fff",
                      }}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* DURATION */}
            <Text className="text-white mt-8 mb-4 text-lg font-sora-semibold">
              Duration
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {[1, 2, 3, 5, 10, 15, 20, 30].map((min) => {
                const active = duration === min;

                return (
                  <Pressable
                    key={min}
                    onPress={() => setDuration(min)}
                    className="px-5 py-4 rounded-[22px]"
                    style={{
                      backgroundColor: active ? "#F5F5F5" : "#1A1A1A",
                    }}
                  >
                    <Text
                      className="font-sora-medium"
                      style={{
                        color: active ? "#000" : "#fff",
                      }}
                    >
                      {min}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ACTIONS */}
            <View className="flex-row gap-4 mt-10 mb-12">
              <Pressable
                onPress={() => setOpen(false)}
                className="flex-1 bg-[#1A1A1A] rounded-[28px] py-5 items-center"
              >
                <Text className="text-white font-sora-semibold">Cancel</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={handleCreateHabit}
                className="flex-1 bg-[#F5F5F5] rounded-[28px] py-5 items-center"
              >
                <Text className="text-black font-sora-bold">
                  {loading ? "Creating..." : "Create Habit"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
