import { loginUser } from "@/libs/firebase/auth";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import InputField from "@/components/InputField";
import { ChevronLeft, Lock, Mail } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const top = useSafeAreaInsets().top;

  const handleLogin = async () => {
    if (!email || !password) return;

    try {
      setLoading(true);
      setError("");

      await loginUser(email.toLowerCase().trim(), password);

      router.replace("/(tabs)/home");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg justify-center px-6">
      <Pressable
        onPress={() => router.back()}
        style={{ top: top + 8 }}
        className="w-10 h-10 absolute left-5 rounded-xl bg-card-2 items-center justify-center"
      >
        <ChevronLeft color="white" size={18} />
      </Pressable>
      {/* HEADER */}
      <View className="mb-10">
        <Text className="text-white text-lg font-sora-bold">Welcome Back</Text>

        <Text className="text-muted text-sm font-sora mt-2 leading-5">
          Sign in to continue your spiritual journey
        </Text>
      </View>

      <InputField
        label="Email"
        icon={Mail}
        value={email}
        autoCapitalize={"none"}
        keyboardType="email-address"
        autoCorrect={false}
        onChangeText={setEmail}
        placeholder="Enter your email"
      />

      <InputField
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
      />

      {/* ERROR */}
      {error ? (
        <View className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl mb-4">
          <Text className="text-red-300 text-xs text-center">{error}</Text>
        </View>
      ) : null}

      {/* BUTTON */}
      <Pressable
        onPress={handleLogin}
        disabled={loading}
        className="bg-white rounded-xl h-14 items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <View className="flex-row items-center">
            <Text className="text-black font-sora-bold text-sm">Sign In</Text>
          </View>
        )}
      </Pressable>

      {/* FOOTER TEXT */}
      <Pressable onPress={() => router.push("/(auth)/signup")}>
        <Text className="text-muted text-xs text-center mt-6">
          Don't have an account?{" "}
          <Text className="text-white font-sora-semibold">Create one</Text>
        </Text>
      </Pressable>
    </View>
  );
}
