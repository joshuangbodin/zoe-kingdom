import { getCategoryIcon } from "@/constants/habit-data";
import { isHabitCompleted } from "@/libs/sqlite/habits";
import { router } from "expo-router";
import { CheckCheck, ChevronRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { PressableScale } from "react-native-pressable-scale";

const HabitCard = ({ item }: { item: any }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const checkIfComplete = async () => {
    const status = await isHabitCompleted(item);

    setIsCompleted(status);
  };

  useEffect(() => {
    checkIfComplete();
  }, []);

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
      <View className="bg-card-1 relative flex-1 min-h-22 items-center justify-center rounded-3xl mb-2 px-4 py-3">
        <View className="flex-row items-center">
          {/* ICON */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{
              backgroundColor: `${item.color}`,
            }}
          >
            {getCategoryIcon(item.category, 18, "#fff")}
          </View>

          {/* INFO */}
          <View className="flex-1 ml-5">
            <Text className="text-white text-sm font-sora-semibold">
              {item.title}
            </Text>

            <Text className="text-muted mt-1 text-xs">
              Daily ・ {item.xpReward}xp ・ {item.streak}🔥
            </Text>
          </View>

          {/* ARROW */}
          {isCompleted ? (
            <View className="p-3 bg-green-700/80 rounded-full py-1  items-center justify-center">
              <CheckCheck color={"white"} size={22} />
            </View>
          ) : (
            <View className="p-3 rounded-xl bg-card-2 items-center justify-center">
              <ChevronRight color={"white"} size={15} />
            </View>
          )}
        </View>
      </View>
    </PressableScale>
  );
};

export default HabitCard;
