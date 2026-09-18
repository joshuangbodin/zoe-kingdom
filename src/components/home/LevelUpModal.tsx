import LottieView from "lottie-react-native";
import { Award } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { onLevelUp, LevelUpPayload } from "@/libs/levelup/events";

const celebration = require("@/assets/lottie/Crown.json");

export default function LevelUpModal() {
  const { isDark } = useTheme();
  const [payload, setPayload] = useState<LevelUpPayload | null>(null);

  useEffect(() => onLevelUp(setPayload), []);

  // Auto-dismiss a few seconds after appearing.
  useEffect(() => {
    if (!payload) return;
    const t = setTimeout(() => setPayload(null), 2800);
    return () => clearTimeout(t);
  }, [payload]);

  if (!payload) return null;

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <Pressable
        onPress={() => setPayload(null)}
        className="flex-1 items-center justify-center bg-black/70 px-8"
      >
        <View className="items-center w-full max-w-sm rounded-[32px] bg-card-2 px-6 pt-2 pb-8">
          <LottieView
            source={celebration}
            autoPlay
            loop
            style={{ width: 180, height: 180 }}
          />
          <Text className="text-primary font-sora-bold text-2xl mt-2">
            LEVEL UP!
          </Text>
          <Text className="text-amber-500 font-sora-bold text-4xl mt-1">
            {payload.level}
          </Text>
          <Text className="text-tertiary font-sora text-xs text-center mt-2 leading-5">
            Your faith journey grows brighter. Keep going!
          </Text>
          <Award size={18} color="#f59e0b" style={{ marginTop: 12 }} />
        </View>
      </Pressable>
    </Modal>
  );
}
