import { loginUser } from "@/libs/firebase/auth";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await loginUser(email.toLowerCase().trim(), password);
      router.replace("/(tabs)/home");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-green-700 mb-6">
        Welcome Back 🔥
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
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
        onPress={handleLogin}
        className="bg-green-600 p-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold">Sign In</Text>
      </Pressable>
    </View>
  );
}
