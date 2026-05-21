import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { auth, db } from "@/libs/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setUserData(snap.data());
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const level = userData?.level || 1;
  const xp = userData?.xp || 0;

  return (
    <View className="flex-1 bg-white px-5 pt-16">

      {/* HEADER */}
      <Text className="text-3xl font-bold text-green-700">
        Profile 👤
      </Text>

      {/* USER CARD */}
      <View className="mt-8 bg-green-50 rounded-3xl p-6 items-center">

        <Text className="text-5xl">👑</Text>

        <Text className="text-xl font-bold mt-3">
          {user?.email}
        </Text>

        <Text className="text-gray-600 mt-2">
          Spirit Level {level}
        </Text>

        <Text className="text-green-700 mt-1">
          XP: {xp}
        </Text>

        <Text className="mt-2 text-gray-500">
          {level < 5
            ? "Seed Stage 🌱"
            : level < 10
            ? "Growing Spirit 🌿"
            : level < 20
            ? "Burning Faith 🔥"
            : "Kingdom Mature 👑"}
        </Text>
      </View>

      {/* STATS SECTION */}
      <View className="mt-8 bg-gray-50 rounded-3xl p-5">

        <Text className="font-bold text-lg">
          Spiritual Stats
        </Text>

        <Text className="mt-2 text-gray-600">
          🔥 Current streak: {userData?.streak || 0} days
        </Text>

        <Text className="text-gray-600 mt-1">
          ⚡ Total XP: {xp}
        </Text>

        <Text className="text-gray-600 mt-1">
          📖 Habits built: loading...
        </Text>

      </View>

      {/* LOGOUT */}
      <Pressable
        onPress={handleLogout}
        className="bg-red-500 mt-10 py-4 rounded-2xl items-center"
      >
        <Text className="text-white font-semibold">
          Logout
        </Text>
      </Pressable>

    </View>
  );
}