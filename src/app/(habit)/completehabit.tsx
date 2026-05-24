import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Check,
  ChevronLeft,
  Music,
  Play,
  Square,
  TimerReset,
} from "lucide-react-native";

import { getCategoryIcon } from "@/constants/habit-data";
import { getHabitById } from "@/libs/sqlite/habits";

const CATEGORY_COLORS: any = {
  prayer: "#7C3AED",
  bible: "#2563EB",
  worship: "#EC4899",
  fasting: "#EA580C",
  discipline: "#10B981",
  evangelism: "#F59E0B",
};

export default function CompleteHabit() {
  const { id } = useLocalSearchParams();

  const { top } = useSafeAreaInsets();

  const [habit, setHabit] = useState<any>(null);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  // prayer
  const [prayerPoints, setPrayerPoints] = useState<string[]>([""]);

  // bible
  const [chapter, setChapter] = useState("");
  const [reflection, setReflection] = useState("");

  // evangelism
  const [soulsReached, setSoulsReached] = useState(0);

  // generic
  const [checked, setChecked] = useState(false);

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    loadHabit();
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [running]);

  const loadHabit = async () => {
    const data = await getHabitById(id as string);

    setHabit(data);

    if (data?.duration) {
      setSecondsLeft(data.duration * 60);
    }
  };

  const category = habit?.category || "discipline";

  const color = CATEGORY_COLORS[category] || "#10B981";

  const progress = useMemo(() => {
    if (!habit?.duration) return 0;

    const total = habit.duration * 60;

    return ((total - secondsLeft) / total) * 100;
  }, [secondsLeft, habit]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;

    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  if (!habit) {
    return (
      <View className="flex-1 items-center justify-center bg-[#090909]">
        <Text className="text-white">Loading Habit...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        paddingTop: top + 10,
      }}
      className="bg-bg px-5 flex-1"
    >
      {/* header */}
      <View className="items-center flex-row justify-between">
        <Pressable className="bg-card-1 p-3 aspect-square rounded-xl">
          <ChevronLeft color={"#fff"} />
        </Pressable>

        <Pressable className=" p-3 aspect-square rounded-xl">
          <Music color={"#fff"} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4">
          {/* TOP CARD */}
          <View className="rounded-2xl bg-card-2 p-5">
            {/* CATEGORY */}
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: `${color}`,
                }}
              >
                {getCategoryIcon(category, 18, "#fff")}
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white text-base font-sora-bold">
                  {habit.title}
                </Text>
                <Text className="text-muted font-sora mt-1 capitalize">
                  {habit.category} ・ {habit.duration} mins ・ {habit.xpReward}
                  xp
                </Text>
              </View>
            </View>
            {/* TIMER */}
            <View className="mt-8">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-xs font-sora-medium">
                  Session Timer
                </Text>
                <Text className="text-white text-sm font-sora-semibold">
                  {formatTime(secondsLeft)}
                </Text>
              </View>
              {/* PROGRESS */}
              <View className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden mt-4">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: "#fff",
                  }}
                />
              </View>
              {/* BUTTONS */}
              <View className="flex-row gap-3 mt-5">
                {!running ? (
                  <Pressable
                    onPress={() => setRunning(true)}
                    className="flex-1 bg-white rounded-xl py-4 items-center"
                  >
                    <View className="flex-row items-center">
                      <Play fill={"black"} color={"black"} size={18} />
                      <Text className="text-black ml-2 font-sora-semibold">
                        Start
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setRunning(false)}
                    className="flex-1 rounded-xl py-4 items-center bg-card-1"
                  >
                    <View className="flex-row items-center">
                      <Square color={"white"} size={16} />
                      <Text className="text-white ml-2 font-sora-semibold">
                        Pause
                      </Text>
                    </View>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    setRunning(false);
                    setSecondsLeft(habit.duration * 60);
                  }}
                  className="w-16 rounded-2xl items-center justify-center bg-[#1A1A1A]"
                >
                  <TimerReset color={"white"} size={20} />
                </Pressable>
              </View>
            </View>
          </View>
          {/* DYNAMIC CONTENT */}
          {/* PRAYER */}
          {category === "prayer" && (
            <View className="mt-6 bg-card-1 rounded-2xl p-6">
              <Text className="text-white text-xl font-sora-bold">
                Prayer Points
              </Text>
              <Text className="text-[#8E8E93] mt-2">
                Write what you want to pray about during this session.
              </Text>
              <View className="mt-6 gap-4">
                {prayerPoints.map((point, index) => (
                  <TextInput
                    key={index}
                    value={point}
                    onChangeText={(text) => {
                      const updated = [...prayerPoints];
                      updated[index] = text;
                      setPrayerPoints(updated);
                    }}
                    placeholder={`Prayer Point ${index + 1}`}
                    placeholderTextColor="#666"
                    className="bg-bg rounded-2xl px-5 py-5 text-white"
                  />
                ))}
              </View>
              <Pressable
                onPress={() => setPrayerPoints((prev) => [...prev, ""])}
                className="bg-bg mt-5 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-sora-semibold">
                  Add Prayer Point
                </Text>
              </Pressable>
            </View>
          )}
          {/* BIBLE */}
          {category === "bible" && (
            <View className="mt-6 bg-[#151515] rounded-[34px] p-6">
              <Text className="text-white text-xl font-sora-bold">
                Bible Study Notes
              </Text>
              <Text className="text-[#8E8E93] mt-2">
                Record what you studied and learned today.
              </Text>
              <TextInput
                value={chapter}
                onChangeText={setChapter}
                placeholder="John 3"
                placeholderTextColor="#666"
                className="bg-[#1D1D1F] mt-6 rounded-2xl px-5 py-5 text-white"
              />
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                multiline
                placeholder="Write your reflections..."
                placeholderTextColor="#666"
                className="bg-[#1D1D1F] mt-4 rounded-2xl px-5 py-5 text-white min-h-[180px]"
                textAlignVertical="top"
              />
            </View>
          )}
          {/* EVANGELISM */}
          {category === "evangelism" && (
            <View className="mt-6 bg-[#151515] rounded-[34px] p-6">
              <Text className="text-white text-xl font-sora-bold">
                Souls Reached
              </Text>
              <Text className="text-[#8E8E93] mt-2">
                Track the number of people you spoke to today.
              </Text>
              <View className="items-center mt-10">
                <Text
                  style={{
                    color,
                  }}
                  className="text-[72px] font-sora-bold"
                >
                  {soulsReached}
                </Text>
                <Text className="text-[#8E8E93] mt-1">people reached</Text>
              </View>
              <View className="flex-row gap-4 mt-8">
                <Pressable
                  onPress={() =>
                    setSoulsReached((prev) => Math.max(0, prev - 1))
                  }
                  className="flex-1 bg-[#1D1D1F] rounded-2xl py-5 items-center"
                >
                  <Text className="text-white text-2xl">−</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSoulsReached((prev) => prev + 1)}
                  className="flex-1 rounded-2xl py-5 items-center"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  <Text className="text-white text-2xl">+</Text>
                </Pressable>
              </View>
            </View>
          )}
          {/* DEFAULT */}
          {!["prayer", "bible", "evangelism"].includes(category) && (
            <View className="mt-6 bg-[#151515] rounded-[34px] p-6">
              <Text className="text-white text-xl font-sora-bold">
                Habit Completion
              </Text>
              <Text className="text-[#8E8E93] mt-2">
                Complete the session after the timer finishes.
              </Text>
              <Pressable
                onPress={() => setChecked(!checked)}
                className="bg-[#1D1D1F] mt-8 rounded-3xl p-5 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-white font-sora-semibold text-lg">
                    I have completed this habit
                  </Text>
                  <Text className="text-[#8E8E93] mt-1">
                    Mark your progress
                  </Text>
                </View>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: checked ? color : "#2A2A2D",
                  }}
                >
                  {checked && <Check color={"white"} size={18} />}
                </View>
              </Pressable>
            </View>
          )}
          {/* COMPLETE BUTTON */}
          <Pressable
            className="mt-8 rounded-2xl bg-white py-5 items-center"
           
          >
            <Text className="text-black text-sm font-sora-bold">
              Complete Habit
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
