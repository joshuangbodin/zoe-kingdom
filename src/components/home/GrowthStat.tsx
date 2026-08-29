import {
  getFireStatus,
  getLevelFromXP,
  getProgressPercentage,
  getXPForNextLevel,
} from "@/constants/levels";
import LottieView from "lottie-react-native";
import { Flame, Share2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useUniwind } from "uniwind";

const spark = require("@/assets/lottie/Fire.json");
const crown = require("@/assets/lottie/Crown.json");

const sparkle = require("@/assets/lottie/Twinkle.json");
const oil = require("@/assets/lottie/Oil.json");

export default function GrowthStat({
  streak,
  xp,
}: {
  streak: number;
  xp: number;
}) {
  const levelNumber = getLevelFromXP(xp);

  const iconColor = useUniwind().theme == "dark" ? "#fff" : "#000";

  const fire = getFireStatus(levelNumber);

  const nextLevelXP = getXPForNextLevel(levelNumber);
  const progress = getProgressPercentage(xp);
  return (
    <View className="gap-2 ">
      {/* top part */}
      <View className="flex-row">
        {/* animation */}
        <View className="w-1/2 relative h-full">
          <LottieView
            source={
              fire.animation === "spark"
                ? sparkle
                : fire.animation === "oil"
                  ? oil
                  : fire.animation === "fire"
                    ? spark
                    : crown
            }
            autoPlay
            loop
            style={{
              width: "100%",
              height: 150,
            }}
          />

          <Pressable className="absolute right-2 bottom-2 p-3 px-4 bg-card-1/80 rounded-full">
            <Share2 size={14} color={"#fff"} />
          </Pressable>
        </View>

        {/* side stats (fire status and current Streak) */}
        <View className="w-1/2 h-full gap-2">
          <View className="p-3 h-13 flex-[.4] justify-between rounded-2xl bg-card-2 ">
            <Text className="font-sora text-[10px] text-muted">
              Altar Fire Status
            </Text>
            <Text className="font-sora-bold text-xs text-white">
              {fire.title}
            </Text>
          </View>
          <View className="p-3 h-16 flex-row flex-[.6] items-end justify-between rounded-2xl bg-card-2 ">
            <View className="h-full justify-between">
              <Text className="font-sora text-[10px] text-muted">
                Current Streak
              </Text>
              <Text className="font-sora-bold text-2xl text-white">
                {streak}
                <Text className="text-[10px] font-sora-medium text-muted">
                  {" "}
                  DAYS
                </Text>
              </Text>
            </View>

            <Flame size={20} color={iconColor} />
          </View>
        </View>
      </View>

      {/* XP */}
      <View className="p-3 rounded-2xl bg-card-1 ">
        <View className="flex-row items-center justify-between">
          <Text className="font-sora text-[10px] text-muted">
            Experience Points(XP)
          </Text>
          <Text className="font-sora-bold text-xs text-white">
            {xp}xp / {nextLevelXP}xp
          </Text>
        </View>

        <View className="relative h-1.5 mt-4 bg-white overflow-hidden rounded-full">
          <View
            style={{ width: `${progress}%` }}
            className="absolute bg-gray-500 rounded-full h-full left-0"
          ></View>
        </View>

        <Text className="mt-2 text-white text-xs font-sora-semibold">
          LEVEL {levelNumber}
        </Text>
      </View>
    </View>
  );
}
