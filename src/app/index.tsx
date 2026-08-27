import { useApp } from "@/context/app-context";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

const Index = () => {
  const { user, isGuest, initializing } = useApp();

  // The AppProvider subscribes to Firebase auth on mount and hydrates the user
  // into context. Once bootstrap completes we route accordingly. Guests are
  // allowed to browse the app without an account.
  useEffect(() => {
    if (initializing) return;

    if (user || isGuest) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/onboarding");
    }
  }, [initializing, user, isGuest]);

  return (
    <View className="relative justify-center items-center bg-black flex-1">
      <Text className="text-white text-3xl font-sora-bold">
        My<Text className="text-muted">Zoe</Text>Life
      </Text>

      <View className="items-center absolute bottom-safe-offset-8">
        <Text className="text-muted text-xs font-sora">Powered By </Text>
        <Text className="text-white font-sora-bold text-lg">Christ.</Text>
      </View>
    </View>
  );
};

export default Index;

