import { getCategoryIcon } from "@/constants/habit-data";
import { useApp } from "@/context/app-context";
import { getHabitStatus } from "@/libs/sqlite/habits";
import { router } from "expo-router";
import { CheckCheck, ChevronRight, Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { PressableScale } from "react-native-pressable-scale";

const HabitCard = ({ item }: { item: any }) => {
  const { habits } = useApp();

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
          params: {
            id: item.id,
          },
        })
      }
    >
      <View className="bg-card-1 relative flex-1 rounded-3xl mb-2 px-4 py-4">
        {/* TOP */}
        <View className="flex-row items-center">
          {/* ICON */}
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: item.color,
            }}
          >
            {getCategoryIcon(item.category, 18, "#fff")}
          </View>

          {/* INFO */}
          <View className="flex-1 ml-4">
            <Text className="text-white text-sm font-sora-semibold">
              {item.title}
            </Text>

            <Text className="text-muted mt-1 text-xs">
              {item.frequency} ・ {item.xpReward}xp ・ {item.streak}🔥
            </Text>
          </View>

          {/* RIGHT */}
          {completed ? (
            <View className="w-10 h-10 rounded-full bg-green-600 items-center justify-center">
              <CheckCheck color="white" size={18} />
            </View>
          ) : (
            <View className="w-10 h-10 rounded-2xl bg-card-2 items-center justify-center">
              <ChevronRight color="white" size={15} />
            </View>
          )}
        </View>

        {/* STATUS AREA */}
        <View className="mt-4 flex-row items-center justify-between">
          {/* LEFT STATUS */}
          <View className="flex-1 pr-3">
            <View className="flex-row items-center">
              {/* LIVE DOT */}
              <View
                className={`w-2 h-2 rounded-full mr-2 ${completed ? "bg-green-400" : "bg-orange-300"}`}
              />

              <Text
                numberOfLines={1}
                className={`text-xs font-sora-medium ${completed ? "text-green-300" : "text-zinc-300"}`}
              >
                {habitStatus?.message || "Pending"}
              </Text>
            </View>

            {/* SUBTLE PROGRESS LINE */}
            {/* <View className="h-0.75 bg-card-2 rounded-full mt-3 overflow-hidden">
              <View
                className={`h-full rounded-full ${completed ? "bg-green-400" : "bg-orange-300"}`}
                style={{
                  width:
                    item.frequency === "twice_daily"
                      ? `${
                          ((habitStatus?.progress?.morning ? 1 : 0) +
                            (habitStatus?.progress?.evening ? 1 : 0)) *
                          50
                        }%`
                      : completed
                        ? "100%"
                        : "0%",
                }}
              />
            </View> */}
          </View>

          {/* TWICE DAILY MINI STATES */}
          {item.frequency === "twice_daily" && habitStatus?.progress && (
            <View className="flex-row items-center gap-3 ml-3">
              {/* MORNING */}
              <View className="items-center">
                <View
                  className={`
              w-8 h-8 rounded-full items-center justify-center
              ${habitStatus.progress.morning ? "bg-yellow-500/15" : "bg-card-2"}
            `}
                >
                  <Sun
                    size={14}
                    color={habitStatus.progress.morning ? "#facc15" : "#666"}
                  />
                </View>

                <View
                  className={`
              mt-1 w-1 h-1 rounded-full
              ${habitStatus.progress.morning ? "bg-yellow-400" : "bg-zinc-600"}
            `}
                />
              </View>

              {/* EVENING */}
              <View className="items-center">
                <View
                  className={`
              w-8 h-8 rounded-full items-center justify-center
              ${habitStatus.progress.evening ? "bg-blue-500/15" : "bg-card-2"}
            `}
                >
                  <Moon
                    size={14}
                    color={habitStatus.progress.evening ? "#60a5fa" : "#666"}
                  />
                </View>

                <View
                  className={`
              mt-1 w-1 h-1 rounded-full
              ${habitStatus.progress.evening ? "bg-blue-400" : "bg-zinc-600"}
            `}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
};

export default HabitCard;
