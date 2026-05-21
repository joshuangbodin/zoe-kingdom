import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { registerUser } from "@/libs/firebase/auth";
import { router } from "expo-router";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await registerUser(email, password);
      router.replace("/(tabs)/home");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">

      <Text className="text-3xl font-bold text-green-700 mb-6">
        Join Zoe Kingdom 👑
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        className="border p-4 rounded-xl mb-4"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="border p-4 rounded-xl mb-6"
      />

      <Pressable
        onPress={handleRegister}
        className="bg-green-600 p-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">
          Create Account
        </Text>
      </Pressable>

    </View>
  );
}