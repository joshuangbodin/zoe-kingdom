/**
 * VictoryCard — the reward screen after a level is restored.
 *
 * Deliberately loud: confetti, staggered stars, an XP count-up, and the scripture
 * the player just restored. This is the payoff that makes the 2-energy spend
 * feel worth it, and it is also where the scripture reveal lands so the puzzle
 * always ends on the Word rather than on a score.
 */

import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import LottieView from "lottie-react-native";

import Confetti from "./Confetti";
import StarRow from "./StarRow";

type Props = {
  stars: number;
  xp: number;
  /** False on a replay that did not improve the rating. */
  isNew: boolean;
  improved: boolean;
  reveal: string;
  reference: string;
  accent: string;
  onDone: () => void;
};

const celebration = require("@/assets/lottie/Crown.json");

export default function VictoryCard({
  stars,
  xp,
  isNew,
  improved,
  reveal,
  reference,
  accent,
  onDone,
}: Props) {
  const [burst, setBurst] = useState(0);
  const [shownXP, setShownXP] = useState(0);

  useEffect(() => {
    setBurst((b) => b + 1);
  }, []);

  // Count the XP up so the number itself feels like a reward.
  useEffect(() => {
    if (xp <= 0) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(xp / 22));
    const timer = setInterval(() => {
      current += step;
      if (current >= xp) {
        setShownXP(xp);
        clearInterval(timer);
      } else {
        setShownXP(current);
      }
    }, 26);
    return () => clearInterval(timer);
  }, [xp]);

  return (
    <View className="items-center py-2">
      <Confetti burstKey={burst} />

      <Animated.View entering={FadeIn.duration(220)} className="items-center">
        <LottieView
          source={celebration}
          autoPlay
          loop={false}
          style={{ width: 130, height: 130 }}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.springify().damping(16)} className="items-center w-full">
        <Text className="text-primary text-[22px] font-sora-bold tracking-wide">
          {improved ? "BETTER!" : isNew ? "RESTORED!" : "COMPLETE!"}
        </Text>

        <View className="my-2">
          <StarRow stars={stars} size={30} animate />
        </View>

        {xp > 0 && (
          <View
            className="rounded-full px-4 py-1.5 mt-1 mb-4"
            style={{ backgroundColor: "#22c55e22" }}
          >
            <Text className="text-emerald-400 text-[14px] font-sora-bold tabular-nums">
              +{shownXP} XP
            </Text>
          </View>
        )}

        {/* The scripture the player just rebuilt — the real reward */}
        <View
          className="rounded-3xl p-4 w-full mb-4 border"
          style={{ backgroundColor: accent + "12", borderColor: accent + "3A" }}
        >
          <Text className="text-primary text-[14px] font-sora-medium leading-6">
            {reveal}
          </Text>
          {!!reference && (
            <Text
              className="text-[11px] font-sora-bold mt-2.5 tracking-wide"
              style={{ color: accent }}
            >
              {reference}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onDone}
          className="rounded-2xl py-3.5 w-full items-center"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-white text-[14px] font-sora-bold tracking-widest">
            CONTINUE ▸
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
