import { useApp } from "@/context/app-context";
import { auth } from "@/libs/firebase";
import { getUserProfile } from "@/libs/firebase/users";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

const Index = () => {
  const [initializing, setInitializing] = useState(true);
  const { setUser } = useApp();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser: User | null) => {
      // Prevent double navigation
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      try {
        if (currentUser) {
          const udata = await getUserProfile(currentUser.uid);
          if (udata) {
            setUser(udata);
          }
          router.replace("/(tabs)/home");
        } else {
          router.replace("/onboarding");
        }
      } catch (err) {
        console.error("Auth redirect error:", err);
        router.replace("/onboarding");
      } finally {
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    return unsub;
  }, []);

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
