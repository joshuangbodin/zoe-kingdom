import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  completeHabit,
  createHabit,
  getHabits,
  Habit,
  isHabitCompleted,
} from "@/libs/sqlite/habits";

const CATEGORIES = [
  { id: "prayer", label: "Prayer", icon: "🙏", color: "#7C3AED" },
  { id: "bible", label: "Bible", icon: "📖", color: "#2563EB" },
  { id: "worship", label: "Worship", icon: "🎵", color: "#EC4899" },
  { id: "fasting", label: "Fasting", icon: "🔥", color: "#EA580C" },
  { id: "discipline", label: "Discipline", icon: "⚔️", color: "#10B981" },
];

export default function Habits() {
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<
    "morning" | "evening" | "twice_daily" | "weekly" | "throughout_day"
  >("morning");
  const [habits, setHabits] = useState<(Habit & { completed?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(10);
  const [initialLoading, setInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  // LOAD HABITS
  const loadHabits = async () => {
    setInitialLoading(true);

    const data = await getHabits();

    const enhanced = await Promise.all(
      data.map(async (habit) => ({
        ...habit,
        completed: await isHabitCompleted(habit),
      })),
    );

    setHabits(enhanced);
    setInitialLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, []),
  );

  // CREATE HABIT
  const handleCreateHabit = async () => {
    if (!title.trim()) return;

    try {
      setLoading(true);

      await createHabit({
        title,
        category: selectedCategory.id,
        frequency,
        icon: selectedCategory.icon,
        color: selectedCategory.color,
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

  // COMPLETE HABIT (instant UI update)
  const handleCompleteHabit = async (habit: any) => {
    try {
      const result = await completeHabit(habit);

      if (!result?.success) return;

      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, completed: true } : h)),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const completedCount = habits.filter((h) => h.completed).length;

  const totalXP = habits.reduce((acc, cur) => acc + cur.xpReward, 0);

  // LOADING SCREEN
  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-white">Loading habits...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg px-5 pt-16">
      {/* HEADER */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-3xl text-white font-sora-bold">
            Holy Habits
          </Text>
          <Text className="text-muted mt-1">Build consistency daily</Text>
        </View>

        <View className="bg-card px-4 py-2 rounded-2xl">
          <Text className="text-white font-sora-semibold">
            {habits.length} Habits
          </Text>
        </View>
      </View>

      {/* STATS */}
      <View className="flex-row gap-3 mt-8">
        <View className="flex-1 bg-card rounded-3xl p-5">
          <Text className="text-muted text-sm">Completed Today</Text>
          <Text className="text-white text-3xl mt-2 font-sora-bold">
            {completedCount}
          </Text>
        </View>

        <View className="flex-1 bg-card rounded-3xl p-5">
          <Text className="text-muted text-sm">XP Possible</Text>
          <Text className="text-white text-3xl mt-2 font-sora-bold">
            {totalXP}
          </Text>
        </View>
      </View>

      {/* SECTION */}
      <View className="mt-10 flex-row items-center justify-between">
        <Text className="text-white text-xl font-sora-semibold">
          Today's Habits
        </Text>

        <Text className="text-muted">
          {completedCount}/{habits.length}
        </Text>
      </View>

      {/* LIST */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 150 }}
        ListEmptyComponent={
          <View className="items-center mt-24">
            <Text className="text-5xl">🔥</Text>
            <Text className="text-white text-lg mt-4 font-sora-semibold">
              No Habits Yet
            </Text>
            <Text className="text-muted text-center mt-2">
              Create your first holy habit and start growing spiritually
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            className="rounded-[30px] p-5 mb-4"
            style={{
              backgroundColor: item.completed ? `${item.color}20` : "#171717",
              borderWidth: 1,
              borderColor: item.completed ? item.color : "#262626",
            }}
          >
            {/* TOP */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: `${item.color}30` }}
                >
                  <Text className="text-2xl">{item.icon}</Text>
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-white text-lg font-sora-semibold">
                    {item.title}
                  </Text>
                  <Text className="text-muted mt-1 capitalize">
                    {item.category}
                  </Text>
                </View>
              </View>

              <View
                className="px-4 py-2 rounded-2xl"
                style={{ backgroundColor: `${item.color}25` }}
              >
                <Text
                  style={{ color: item.color }}
                  className="font-sora-semibold"
                >
                  +{item.xpReward}XP
                </Text>
              </View>
            </View>

            {/* BUTTON */}
            <Pressable
              disabled={item.completed}
              onPress={() => handleCompleteHabit(item)}
              className={`mt-5 py-4 rounded-2xl items-center ${
                item.completed ? "bg-card" : "bg-white"
              }`}
            >
              <Text
                className={`font-sora-semibold ${
                  item.completed ? "text-green-400" : "text-black"
                }`}
              >
                {item.completed ? "Completed Today ✅" : "Complete Habit"}
              </Text>
            </Pressable>
          </View>
        )}
      />

      {/* FLOAT BUTTON */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-10 right-6 bg-white w-16 h-16 rounded-full items-center justify-center"
        style={{ elevation: 10 }}
      >
        <Text className="text-4xl text-black">+</Text>
      </Pressable>

      {/* MODAL */}
      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#111] rounded-t-[40px] p-6">
            <Text className="text-white text-2xl font-sora-bold">
              Create Habit
            </Text>

            <TextInput
              placeholder="Morning Prayer..."
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              className="bg-card mt-6 rounded-3xl px-5 py-5 text-white"
            />

            {/* CATEGORIES */}
            <View className="flex-row flex-wrap gap-3 mt-6">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory.id === cat.id;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat)}
                    className="px-4 py-3 rounded-2xl flex-row items-center"
                    style={{
                      backgroundColor: active ? cat.color : "#1F1F1F",
                    }}
                  >
                    <Text className="mr-2">{cat.icon}</Text>
                    <Text className="text-white">{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-white mt-6 mb-3 font-sora-semibold">
              Frequency
            </Text>

            {/*Frequency*/}
            <View className="flex-row flex-wrap gap-3">
              {[
                {
                  id: "morning",
                  label: "Morning",
                  icon: "🌅",
                },
                {
                  id: "evening",
                  label: "Evening",
                  icon: "🌇",
                },
                {
                  id: "twice_daily",
                  label: "Twice Daily",
                  icon: "🔁",
                },
                {
                  id: "weekly",
                  label: "Weekly",
                  icon: "📅",
                },
                {
                  id: "throughout_day",
                  label: "Anytime",
                  icon: "🌤️",
                },
              ].map((f) => {
                const active = frequency === f.id;

                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFrequency(f.id as any)}
                    className="px-4 py-3 rounded-2xl flex-row items-center"
                    style={{
                      backgroundColor: active ? "#fff" : "#1F1F1F",
                    }}
                  >
                    <Text className="mr-2">{f.icon}</Text>
                    <Text
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

            <Text className="text-white mt-6 mb-3 font-sora-semibold">
              Duration (minutes)
            </Text>

            <View className="flex-row flex-wrap items-center gap-3">
              {[1, 2, 3, 4, 5, 10, 15, 20, 30].map((min) => (
                <Pressable
                  key={min}
                  onPress={() => setDuration(min)}
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: duration === min ? "#fff" : "#1F1F1F",
                  }}
                >
                  <Text style={{ color: duration === min ? "#000" : "#fff" }}>
                    {min}m
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ACTIONS */}
            <View className="flex-row gap-3 mt-8">
              <Pressable
                onPress={() => setOpen(false)}
                className="flex-1 bg-card rounded-3xl py-5 items-center"
              >
                <Text className="text-white font-sora-semibold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateHabit}
                disabled={loading}
                className="flex-1 bg-white rounded-3xl py-5 items-center"
              >
                <Text className="text-black font-sora-bold">
                  {loading ? "Creating..." : "Create Habit"}
                </Text>
              </Pressable>
            </View>

            <View className="h-10" />
          </View>
        </View>
      </Modal>
    </View>
  );
}
