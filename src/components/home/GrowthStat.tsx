import {
  getFireStatus,
  getLevelFromXP,
  getProgressPercentage,
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

/**
 * Premium growth overview.
 *
 * A calm, consistent typographic hierarchy:
 *   micro-label (uppercase, tracked) -> title/big value
 * All values sit on the same muted-label language so nothing competes for
 * attention. The flame animation is a compact decorative accent rather than a
 * full-bleed block, which keeps the page balanced.
 */
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
  const progress = getProgressPercentage(xp);

  const lottie =
    fire.animation === "spark"
      ? sparkle
      : fire.animation === "oil"
        ? oil
        : fire.animation === "fire"
          ? spark
          : crown;

  return (
    <View className="gap-3">
      {/* HERO — fire status + level + XP progress */}
      <View className="bg-card-1 rounded-3xl p-6 overflow-hidden">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[10px] font-sora-medium uppercase tracking-[0.2em] text-tertiary">
              Altar Fire
            </Text>
            <Text className="text-primary text-xl font-sora-bold mt-2">
              {fire.title}
            </Text>
            <Text className="text-tertiary text-xs font-sora mt-1.5">
              Level {levelNumber}
            </Text>
          </View>

          {/* decorative flame accent */}
          <View className="relative">
            <LottieView
              source={lottie}
              autoPlay
              loop
              style={{ width: 84, height: 84 }}
            />
            <Pressable className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-overlay items-center justify-center">
              <Share2 size={13} color="#ffffff80" />
            </Pressable>
          </View>
        </View>

        {/* XP progress */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-sora-medium uppercase tracking-[0.2em] text-tertiary">
              Next level
            </Text>
            <Text className="text-secondary text-xs font-sora-medium">
              {xp} / {nextLevelXP} XP
            </Text>
          </View>
          <View className="h-1.5 bg-overlay rounded-full overflow-hidden">
            <View
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
        </View>
      </View>

      {/* STREAK */}
      <View className="bg-card-1 rounded-3xl px-6 py-5 flex-row items-center justify-between">
        <Text className="text-[10px] font-sora-medium uppercase tracking-[0.2em] text-tertiary">
          Current streak
        </Text>
        <Text className="text-primary text-2xl font-sora-bold">
          {streak}
          <Text className="text-xs text-tertiary font-sora-medium"> days</Text>
        </Text>
      </View>
    </View>
  );
}
