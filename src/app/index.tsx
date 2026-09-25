import { useApp } from "@/context/app-context";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Index = () => {
  const { user, isGuest, initializing } = useApp();
  const bottom = useSafeAreaInsets().bottom + 10;

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
    <View className="relative justify-center items-center bg-bg flex-1">
      <Text className="text-primary text-3xl font-sora-bold">
        My<Text className="text-primary/80">Zoe</Text>Life
      </Text>

      <View style={{ bottom }} className="items-center absolute">
        <Text className="text-primary/80 text-xs font-sora">Powered By </Text>
        <Text className="text-primary font-sora-bold text-lg">Christ.</Text>
      </View>
    </View>
  );
};

export default Index;
