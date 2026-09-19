import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
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
  X,
} from "lucide-react-native";

import { useToast } from "@/components/Toast";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
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
  const { setHabits, syncHabitLogs } = useApp();
  const { isDark } = useTheme();
  const inactiveIcon = "#fff";
  const player = useAudioPlayer(require("@/assets/sounds/wn-2.mp3"));
  const playerStatus = useAudioPlayerStatus(player);
  const isMusicPlaying = playerStatus?.playing ?? false;
  const [musicOn, setMusicOn] = useState<boolean>(true);

  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      player.pause();
      setMusicOn(false);
    } else {
      player.play();
      setMusicOn(true);
    }
  }, [player, isMusicPlaying]);


  const bg = require("@/assets/images/bgs/bg-4.gif");
  const bg2 = require("@/assets/images/bgs/bg-5.gif");

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const [completed, setCompleted] = useState<any>({
    status: false,
    message: "",
    progress: {},
  });

  const [sessionFinished, setSessionFinished] = useState(false);
  const { showToast } = useToast();

  // prayer
  const [prayerPoints, setPrayerPoints] = useState<string[]>([""]);

  // bible
  const [chapter, setChapter] = useState("");
  const [reflection, setReflection] = useState("");

  // evangelism
  const [soulsReached, setSoulsReached] = useState(0);

  // generic
  const [checked, setChecked] = useState(false);

  // Guards against rapid double-taps firing concurrent `completeHabit` calls,
  // which could award XP twice before the duplicate check sees the insert.
  const [completing, setCompleting] = useState(false);

  const intervalRef = useRef<any>(null);
  // Background music: configure + loop. Best-effort; never blocks the UI.
  useEffect(() => {
    player.loop = true;
    player.volume = 0.7;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
    return () => {
      try {
        player.pause();
      } catch {
        /* released */
      }
    };
  }, [player]);

  // Immersive UX: start the music when the focus timer begins; stop on finish.
  useEffect(() => {
    try {
      if (running && musicOn) player.play();
      if (sessionFinished) player.pause();
    } catch {
      /* player unavailable while navigating away */
    }
  }, [running, sessionFinished, player, musicOn]);


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

    const status = await getHabitStatus(data);
    setCompleted(status);

    if (data?.duration) {
      setSecondsLeft(data.duration * 60);
    }
  };

  const HandleCompleteHabit = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const data = await completeHabit(habit);
      if (data.success) {
        showToast("Habit completed! +" + habit.xpReward + " XP", "success");
        // Auto-upload the new completion if online; otherwise it flushes via the
        // reconnect effect in AppProvider. Best-effort, never blocks completion.
        syncHabitLogs().catch(() => {});
        await loadHabit();
      } else if (data.reason === "already_completed") {
        showToast("Already completed today!", "info");
      }
    } finally {
      setCompleting(false);
    }
  };

  const category = habit?.category || "discipline";
  const color = CATEGORY_COLORS[category] || "#10B981";

  const { width, height } = useWindowDimensions();

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
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-secondary text-sm font-sora">Loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={{ paddingTop: top + 8 }}
      className="bg-black/50 relative px-5 flex-1"
    >
      <Image
        source={isDark ? bg : bg2}
        style={{
          width,
          height,
        }}
        className="absolute flex-1 -z-10"
      />

      {/* header */}
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center"
        >
          <ChevronLeft color={"#fff"} size={18} />
        </Pressable>

        <Text className="text-white capitalize font-medium">{habit.title}</Text>
        <Pressable
          onPress={toggleMusic}
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            isMusicPlaying ? "bg-amber-500/25" : "bg-white/10"
          }`}
        >
          <Music color={isMusicPlaying ? "#fbbf24" : "#fff"} size={16} />
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* TOP CARD */}
          <View className=" mt-20">
            {/* HEADER */}
            <View className="flex-row items-center">
              <View className=" flex-1">
                <Text className="text-white text-base font-sora-semibold">
                  {habit.title}
                </Text>
                <Text className="text-white/80 text-[10px] font-sora mt-0.5 capitalize">
                  {habit.category} · {habit.duration} mins · {habit.xpReward}xp
                </Text>
              </View>

              <View
                className={`px-3 py-1.5 rounded-full ${
                  completed?.status ? "bg-green-500/20" : "bg-orange-500/20"
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      completed?.status ? "bg-green-400" : "bg-orange-300"
                    }`}
                  />
                  <Text
                    className={`text-[10px] font-sora-medium ${
                      completed?.status ? "text-green-400" : "text-orange-300"
                    }`}
                  >
                    {completed?.status ? "Done" : "Active"}
                  </Text>
                </View>
              </View>
            </View>

            {/* TIMER SECTION */}
            <View className="mt-6">
              <View className="items-center flex-row justify-between">
                <View>
                  <Text className="text-white/80 text-xs font-sora leading-5">
                    {completed?.message ?? "Focus Session"}
                  </Text>
                </View>
                <Text className="text-xs text-white font-sora-bold tracking-tight">
                  {formatTime(secondsLeft)}
                </Text>
              </View>

              {/* PROGRESS */}
              <View className="h-1 bg-white/15 rounded-full overflow-hidden mt-6">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: "#fff" }}
                />
              </View>

              {/* CONTROLS */}
              <View className="flex-row gap-2 justify-center items-center mt-3">
                <Pressable
                  onPress={() => router.back()}
                  className="p-4 rounded-full items-center justify-center bg-white/10"
                >
                  <X color="white" size={18} />
                </Pressable>

                {!running ? (
                  <Pressable
                    onPress={() => setRunning(true)}
                    className=" rounded-full  bg-white  p-4 items-center"
                  >
                    <View className="flex-row items-center">
                      <Play fill="black" color="black" size={25} />
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setRunning(false)}
                    className=" rounded-full  bg-white/10  p-4 items-center"
                  >
                    <View className="flex-row items-center">
                      <Square color="white" size={25} />
                    </View>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    setRunning(false);
                    setSecondsLeft(habit.duration * 60);
                  }}
                  className="p-4 rounded-full items-center justify-center bg-white/10"
                >
                  <TimerReset color="white" size={18} />
                </Pressable>
              </View>
            </View>

            {/* TWICE DAILY */}
            {habit.frequency === "twice_daily" && completed?.progress && (
              <View className="flex-row gap-2 mt-4">
                <View
                  className={`flex-1 rounded-3xl p-5 ${
                    completed.progress.morning
                      ? "bg-yellow-500/30"
                      : "bg-white/10"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Sun
                      size={14}
                      color={
                        completed.progress.morning ? "#facc15" : inactiveIcon
                      }
                    />
                    {completed.progress.morning && (
                      <Check size={12} color="#facc15" />
                    )}
                  </View>
                  <Text className="text-white text-sm font-sora-semibold mt-2">
                    Morning
                  </Text>
                  <Text className="text-white/80 text-[10px] mt-0.5">
                    {completed.progress.morning ? "Done" : "Remaining"}
                  </Text>
                </View>

                <View
                  className={`flex-1 rounded-3xl p-5 ${
                    completed.progress.evening
                      ? "bg-blue-500/10"
                      : "bg-white/10"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Moon
                      size={14}
                      color={
                        completed.progress.evening ? "#60a5fa" : inactiveIcon
                      }
                    />
                    {completed.progress.evening && (
                      <Check size={12} color="#60a5fa" />
                    )}
                  </View>
                  <Text className="text-white text-sm font-sora-semibold mt-2">
                    Evening
                  </Text>
                  <Text className="text-white/80 text-[10px] mt-0.5">
                    {completed.progress.evening ? "Done" : "Remaining"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* DYNAMIC CONTENT */}
          {/* PRAYER */}
          {category === "prayer" && (
            <View className="mt-4 bg-black/50 rounded-3xl p-5">
              <Text className="text-white text-sm font-sora-semibold">
                Prayer Points
              </Text>
              <Text className="text-white/80 text-[10px] font-sora mt-1">
                Write what you want to pray about.
              </Text>
              <View className="mt-4 gap-3">
                {prayerPoints.map((point, index) => (
                  <TextInput
                    key={index}
                    value={point}
                    onChangeText={(text) => {
                      const updated = [...prayerPoints];
                      updated[index] = text;
                      setPrayerPoints(updated);
                    }}
                    placeholder={`Point ${index + 1}`}
                    placeholderTextColor="#ddd"
                    className="bg-white/10 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora"
                  />
                ))}
              </View>
              <Pressable
                onPress={() => setPrayerPoints((prev) => [...prev, ""])}
                className="bg-white/10 mt-3 rounded-xl py-3.5 items-center"
              >
                <Text className="text-white/70 text-sm font-sora-semibold">
                  + Add Point
                </Text>
              </Pressable>
            </View>
          )}

          {/* BIBLE */}
          {category === "bible" && (
            <View className="mt-4 bg-black/50 rounded-3xl p-5">
              <Text className="text-white text-sm font-sora-semibold">
                Bible Study Notes
              </Text>
              <Text className="text-white/80 text-[10px] font-sora mt-1">
                Record what you studied.
              </Text>
              <TextInput
                value={chapter}
                onChangeText={setChapter}
                placeholder="John 3"
                placeholderTextColor="#ddd"
                className="bg-white/10 mt-4 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora"
              />
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                multiline
                placeholder="Write your reflections..."
                placeholderTextColor="#ddd"
                className="bg-white/10 mt-3 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora min-h-20"
                textAlignVertical="top"
              />
            </View>
          )}

          {/* EVANGELISM */}
          {category === "evangelism" && (
            <View className="mt-4 bg-black/50 rounded-3xl p-5">
              <Text className="text-white text-sm font-sora-semibold">
                Souls Reached
              </Text>
              <Text className="text-white/80 text-[10px] font-sora mt-1">
                Track people you spoke to today.
              </Text>
              <View className="items-center mt-6">
                <Text style={{ color }} className="text-[56px] font-sora-bold">
                  {soulsReached}
                </Text>
                <Text className="text-white/80 text-[10px] font-sora mt-1">
                  people reached
                </Text>
              </View>
              <View className="flex-row gap-3 mt-6">
                <Pressable
                  onPress={() =>
                    setSoulsReached((prev) => Math.max(0, prev - 1))
                  }
                  className="flex-1 bg-white/10 rounded-xl py-4 items-center"
                >
                  <Text className="text-white text-xl">−</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSoulsReached((prev) => prev + 1)}
                  className="flex-1 rounded-xl py-4 items-center"
                  style={{ backgroundColor: color }}
                >
                  <Text className="text-white text-xl">+</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* DEFAULT */}
          {!["prayer", "bible", "evangelism"].includes(category) && (
            <View className="mt-4 bg-black/50 rounded-3xl p-5">
              <Text className="text-white text-sm font-sora-semibold">
                Completion
              </Text>
              <Text className="text-white/80 text-[10px] font-sora mt-1">
                Mark as complete after the timer finishes.
              </Text>
              <Pressable
                onPress={() => setChecked(!checked)}
                className="bg-white/10 mt-4 rounded-xl p-4 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-white text-sm font-sora-semibold">
                    I completed this habit
                  </Text>
                  <Text className="text-white/80 text-[10px] font-sora mt-0.5">
                    Mark your progress
                  </Text>
                </View>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: checked ? color : "#2A2A2D" }}
                >
                  {checked && <Check color="white" size={14} />}
                </View>
              </Pressable>
            </View>
          )}

          {/* COMPLETE BUTTON */}
          <Pressable
            disabled={!sessionFinished || completing}
            onPress={HandleCompleteHabit}
            className={`mt-6 rounded-xl py-4 items-center ${
              sessionFinished ? "bg-white" : "bg-black/50"
            }`}
          >
            <Text
              className={`text-sm font-sora-semibold ${
                sessionFinished ? "text-black" : "text-white/80"
              }`}
            >
              {running
                ? `Complete in ${formatTime(secondsLeft)}`
                : sessionFinished
                  ? completed?.status
                    ? "Already Completed ✓"
                    : "Complete Habit"
                  : "Start Timer First"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
