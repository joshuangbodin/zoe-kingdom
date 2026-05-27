import {
  getFireStatus,
  getLevelFromXP,
  getXPForNextLevel,
} from "@/constants/levels";
import LottieView from "lottie-react-native";
import { Share2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

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

  const fire = getFireStatus(levelNumber);

  const nextLevelXP = getXPForNextLevel(levelNumber);
  const progress = ((nextLevelXP - xp) / nextLevelXP) * 100;
  return (
    <View className="gap-2 mt-10">
      {/* top part */}
      <View className="flex-row">
        {/* animation */}
        <View className="flex-[.6] relative h-50">
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
              height: 200,
            }}
          />

          <Pressable className="absolute right-2 bottom-2 p-3 bg-card-1/80 rounded-full">
            <Share2 color={"#fff"} />
          </Pressable>
        </View>

        {/* side stats (fire status and current Streak) */}
        <View className="flex-[.4] h-full gap-2">
          <View className="p-5 flex-[.4] justify-between rounded-3xl bg-card-1 ">
            <Text className="font-sora text-xs text-muted">
              Altar Fire Status
            </Text>
            <Text className="font-sora-semibold text-sm text-white">
              {fire.title}
            </Text>
          </View>
          <View className="p-5 flex-[.6] justify-between rounded-3xl bg-card-1 ">
            <Text className="font-sora text-xs text-muted">Current Streak</Text>
            <Text className="font-sora-semibold text-xl text-white">
              {streak}
              <Text className="text-xs text-muted">/DAYS</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* XP */}
      <View className="p-6 rounded-3xl bg-card-2 ">
        <View className="flex-row items-center justify-between">
          <Text className="font-sora text-xs text-muted">
            Experience Points(XP)
          </Text>
          <Text className="font-sora-semibold text-sm text-white">
            {xp}xp / {nextLevelXP}xp
          </Text>
        </View>

        <View className="relative h-2.5 mt-4 bg-white overflow-hidden rounded-full">
          <View
            style={{ width: `${progress}%` }}
            className="absolute bg-gray-500 rounded-full h-full left-0"
          ></View>
        </View>

        <Text className="mt-2 text-white font-sora-semibold">
          LEVEL {levelNumber}
        </Text>
      </View>
    </View>
  );
}
