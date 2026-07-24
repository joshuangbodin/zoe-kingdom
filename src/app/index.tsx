import { useApp } from "@/context/app-context";
import { auth } from "@/libs/firebase";
import { getUserProfile } from "@/libs/firebase/users";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

const index = () => {
  const [initializing, setInitializing] = useState(true);
  const { user, setUser } = useApp();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser: any) => {
      if (currentUser) {
        const udata = await getUserProfile(currentUser.uid);
        setUser(udata);
        router.push("/(tabs)/home");
        if (initializing) {
          setInitializing(false);
        }
        return;
      }

      router.push("/onboarding");

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
