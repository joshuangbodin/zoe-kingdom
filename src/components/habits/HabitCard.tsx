import { getCategoryIcon } from "@/constants/habit-data";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
import { getHabitStatus } from "@/libs/sqlite/habits";
import { router } from "expo-router";
import { CheckCheck, ChevronRight, Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { PressableScale } from "react-native-pressable-scale";

const HabitCard = ({ item }: { item: any }) => {
  const { habits } = useApp();
  const { isDark } = useTheme();
  const inactiveIcon = isDark ? "#555" : "#a1a1aa";

  const [habitStatus, setHabitStatus] = useState<any>(null);

  const checkIfComplete = async () => {
    const status = await getHabitStatus(item);
    setHabitStatus(status);
  };

  useEffect(() => {
    checkIfComplete();
  }, [habits]);

  const completed = habitStatus?.status;

  return (
    <PressableScale
      activeScale={0.97}
      onPress={() =>
        router.push({
          pathname: "/(habit)/completehabit",
          params: { id: item.id },
        })
      }
    >
      <View className="bg-card-1 rounded-2xl mb-2 px-4 py-4">
        {/* TOP */}
        <View className="flex-row items-center">
          {/* ICON */}
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: item.color + "30" }}
          >
            {getCategoryIcon(item.category, 16, item.color)}
          </View>

          {/* INFO */}
          <View className="flex-1 ml-3">
            <Text className="text-primary text-sm font-sora-semibold">
              {item.title}
            </Text>
            <Text className="text-tertiary mt-0.5 text-[10px] font-sora">
              {item.frequency?.replace("_", " ")} · {item.xpReward}xp
            </Text>
          </View>

          {/* RIGHT */}
          {completed ? (
            <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center">
              <CheckCheck color="#4ade80" size={14} />
            </View>
          ) : (
            <View className="w-8 h-8 rounded-xl bg-overlay items-center justify-center">
              <ChevronRight color={inactiveIcon} size={14} />
            </View>
          )}
        </View>

        {/* STATUS AREA */}
        <View className="mt-3 flex-row items-center justify-between">
          {/* LEFT STATUS */}
          <View className="flex-1 pr-3">
            <View className="flex-row items-center">
              {/* LIVE DOT */}
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${completed ? "bg-green-400" : "bg-orange-300"}`}
              />

              <Text
                numberOfLines={1}
                className={`text-[10px] font-sora-medium ${completed ? "text-green-400/80" : "text-secondary"}`}
              >
                {habitStatus?.message || "Pending"}
              </Text>
            </View>
          </View>

          {/* TWICE DAILY MINI STATES */}
          {item.frequency === "twice_daily" && habitStatus?.progress && (
            <View className="flex-row items-center gap-2 ml-3">
              <View className="items-center">
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    habitStatus.progress.morning ? "bg-yellow-500/15" : "bg-overlay"
                  }`}
                >
                  <Sun
                    size={10}
                    color={habitStatus.progress.morning ? "#facc15" : inactiveIcon}
                  />
                </View>
              </View>

              <View className="items-center">
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    habitStatus.progress.evening ? "bg-blue-500/15" : "bg-overlay"
                  }`}
                >
                  <Moon
                    size={10}
                    color={habitStatus.progress.evening ? "#60a5fa" : inactiveIcon}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
};

export default HabitCard;