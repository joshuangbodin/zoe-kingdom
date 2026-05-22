import { auth } from "@/libs/firebase";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

const index = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser as any);
        router.push("/(tabs)/home");
        if (initializing) {
          setInitializing(false);
        }
        return;
      }

      router.push("/(auth)/signin");

      if (initializing) {
        setInitializing(false);
      }
    });

    return unsub;
  }, []);

  
  return (
    <View className="relative justify-center items-center  bg-black flex-1 ">
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

export default index;
