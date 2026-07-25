import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Check,
  ChevronLeft,
  Moon,
  Music,
  Play,
  Square,
  Sun,
  TimerReset,
} from "lucide-react-native";

import { getCategoryIcon } from "@/constants/habit-data";
import { useApp } from "@/context/app-context";
import {
  completeHabit,
  getHabitById,
  getHabits,
  getHabitStatus,
} from "@/libs/sqlite/habits";

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

  const { setHabits } = useApp();

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const [completed, setCompleted] = useState<any>({
    status: false,
    message: "",
    progress: {},
  });

  const [sessionFinished, setSessionFinished] = useState(false);

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
            setSessionFinished(true);

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
    const h = await getHabits();
    setHabits(h);
    setHabit(data);

    const completed = await getHabitStatus(data);

    setCompleted(completed);

    if (data?.duration) {
      setSecondsLeft(data.duration * 60);
    }
  };

  const HandleCompleteHabit = async () => {
    const data = await completeHabit(habit);

    if (data.success) {
      Alert.alert(data.reason || "completed");
      await loadHabit();
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
        <Pressable
          onPress={() => router.back()}
          className="bg-card-1 p-3 aspect-square rounded-xl"
        >
          <ChevronLeft color={"#fff"} />
        </Pressable>

        <Pressable className=" p-3 aspect-square rounded-xl">
          <Music color={"#fff"} />
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          contentContainerClassName="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-4">
            {/* TOP CARD */}
            <View className="rounded-[34px] overflow-hidden bg-card-2 p-6">
              {/* HEADER */}
              <View className="flex-row items-center">
                {/* ICON */}
                <View
                  className="w-14 h-14 rounded-[22px] items-center justify-center"
                  style={{
                    backgroundColor: color,
                  }}
                >
                  {getCategoryIcon(category, 22, "#fff")}
                </View>

                {/* INFO */}
                <View className="ml-4 flex-1">
                  <Text className="text-white text-lg font-sora-bold">
                    {habit.title}
                  </Text>

                  <Text className="text-muted font-sora text-xs mt-1 capitalize">
                    {habit.category} ・ {habit.duration} mins ・{" "}
                    {habit.xpReward}xp
                  </Text>
                </View>

                {/* LIVE STATUS */}
                <View className="items-end">
                  <View
                    className={`px-3 py-2 rounded-full ${completed?.status ? "bg-green-500/15" : "bg-orange-500/10"} `}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-2 h-2 rounded-full mr-2 ${completed?.status ? "bg-green-400" : "bg-orange-300"}`}
                      />

                      <Text
                        className={`text-[11px] font-sora-medium ${completed?.status ? "text-green-300" : "text-orange-200"}`}
                      >
                        {completed?.status ? "Completed" : "In Progress"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* STATUS MESSAGE */}
              {!!completed?.message && (
                <View className="mt-5">
                  <Text className="text-zinc-300 leading-6 font-sora text-sm">
                    {completed.message}
                  </Text>
                </View>
              )}

              {/* TWICE DAILY */}
              {habit.frequency === "twice_daily" && completed?.progress && (
                <View className="flex-row gap-3 mt-5">
                  {/* MORNING */}
                  <View
                    className={`flex-1 rounded-2xl p-4 ${completed.progress.morning ? "bg-yellow-500/10" : "bg-card-1"}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Sun
                        size={18}
                        color={completed.progress.morning ? "#facc15" : "#666"}
                      />

                      {completed.progress.morning && (
                        <Check size={16} color="#facc15" />
                      )}
                    </View>

                    <Text className="text-white font-sora-semibold mt-4">
                      Morning
                    </Text>

                    <Text className="text-muted text-xs mt-1">
                      {completed.progress.morning ? "Completed" : "Remaining"}
                    </Text>
                  </View>

                  {/* EVENING */}
                  <View
                    className={`flex-1 rounded-2xl p-4 ${completed.progress.evening ? "bg-blue-500/10" : "bg-card-1"}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Moon
                        size={18}
                        color={completed.progress.evening ? "#60a5fa" : "#666"}
                      />

                      {completed.progress.evening && (
                        <Check size={16} color="#60a5fa" />
                      )}
                    </View>

                    <Text className="text-white font-sora-semibold mt-4">
                      Evening
                    </Text>

                    <Text className="text-muted text-xs mt-1">
                      {completed.progress.evening ? "Completed" : "Remaining"}
                    </Text>
                  </View>
                </View>
              )}

              {/* TIMER SECTION */}
              <View className="mt-8">
                {/* TIMER */}
                <View className="items-center">
                  <Text
                    style={{
                      color,
                    }}
                    className="text-[52px] font-sora-bold tracking-tight"
                  >
                    {formatTime(secondsLeft)}
                  </Text>

                  <Text className="text-muted text-xs mt-1 font-sora-medium">
                    Focus Session
                  </Text>
                </View>

                {/* PROGRESS */}
                <View className="h-1.25 bg-card-1 rounded-full overflow-hidden mt-8">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: color,
                    }}
                  />
                </View>

                {/* CONTROLS */}
                <View className="flex-row gap-3 mt-6">
                  {!running ? (
                    <Pressable
                      onPress={() => setRunning(true)}
                      className="flex-1 rounded-2xl py-5 items-center"
                      style={{
                        backgroundColor: color,
                      }}
                    >
                      <View className="flex-row items-center">
                        <Play fill={"white"} color={"white"} size={18} />

                        <Text className="text-white ml-2 font-sora-semibold">
                          {secondsLeft === habit.duration * 60
                            ? "Begin Session"
                            : "Resume"}
                        </Text>
                      </View>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setRunning(false)}
                      className="flex-1 rounded-2xl py-5 items-center bg-card-1"
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
                    className="w-16 rounded-2xl items-center justify-center bg-card-1"
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
                <Text className="text-white  text-base font-sora-bold">
                  Prayer Points
                </Text>
                <Text className="text-muted font-sora text-xs mt-2">
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
                <Text className="text-muted font-sora text-xs mt-2">
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
                  className="bg-[#1D1D1F] mt-4 rounded-2xl px-5 py-5 text-white min-h-45"
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
                <Text className="text-muted font-sora text-xs mt-2">
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
                  <Text className="text-muted font-sora text-xs mt-1">
                    people reached
                  </Text>
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
                <Text className="text-muted font-sora text-xs mt-2">
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
                    <Text className="text-muted font-sora text-xs mt-1">
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
              disabled={!sessionFinished}
              onPress={HandleCompleteHabit}
              className={`mt-8 rounded-2xl py-5 items-center ${
                sessionFinished ? "bg-white" : "bg-card-1"
              }`}
            >
              <Text
                className={`text-sm font-sora-bold ${
                  sessionFinished ? "text-black" : "text-muted"
                }`}
              >
                {running
                  ? `Complete in ${formatTime(secondsLeft)}`
                  : sessionFinished
                    ? completed?.status
                      ? "Hooray! Already completed"
                      : "Complete Habit"
                    : "Start Timer First"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
