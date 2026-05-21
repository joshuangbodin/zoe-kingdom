import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

import {
  completeHabit,
  createHabit,
  getHabits,
  Habit,
} from "@/libs/sqlite/habits";

export default function Habits() {
  const [title, setTitle] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  // LOAD HABITS
  const loadHabits = async () => {
    const data = await getHabits();
    setHabits(data);
  };

  // REFRESH WHEN SCREEN OPENS
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

      await createHabit(title);

      setTitle("");

      await loadHabits();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // COMPLETE HABIT
  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId);

      await loadHabits();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View className="flex-1 bg-white px-5 pt-16">
      {/* HEADER */}
      <Text className="text-3xl font-bold text-green-700">Habits 🔥</Text>

      <Text className="text-gray-500 mt-1">
        Grow your spirit through consistency
      </Text>

      {/* CREATE HABIT */}
      <View className="mt-8">
        <TextInput
          placeholder="Enter a new habit..."
          value={title}
          onChangeText={setTitle}
          className="border border-gray-300 rounded-2xl px-4 py-4 text-base"
        />

        <Pressable
          onPress={handleCreateHabit}
          disabled={loading}
          className="bg-green-600 rounded-2xl py-4 mt-3 items-center"
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Creating..." : "Create Habit"}
          </Text>
        </Pressable>
      </View>

      {/* HABITS LIST */}
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400">No habits yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="border border-gray-200 rounded-3xl p-5 mb-4">
            {/* TITLE */}
            <Text className="text-lg font-semibold text-black">
              {item.title}
            </Text>

            {/* STREAK */}
            <Text className="text-gray-500 mt-1">Streak: {item.streak} 🔥</Text>

            {/* XP */}
            <Text className="text-green-700 mt-1">+{item.xpReward} XP</Text>

            {/* COMPLETE BUTTON */}
            <Pressable
              onPress={() => handleCompleteHabit(item.id)}
              className="bg-black rounded-2xl py-3 items-center mt-4"
            >
              <Text className="text-white font-medium">Complete Habit</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
