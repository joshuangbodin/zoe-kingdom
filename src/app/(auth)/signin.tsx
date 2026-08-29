import { useApp } from "@/context/app-context";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Simple multi-color "G" badge matching the Google logo. */
function GoogleMark() {
  return (
    <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
      <Text className="text-sm" style={{ fontFamily: "Geist-Bold", lineHeight: 18 }}>
        <Text style={{ color: "#4285F4" }}>G</Text>
        <Text style={{ color: "#EA4335" }}>o</Text>
        <Text style={{ color: "#FBBC05" }}>o</Text>
        <Text style={{ color: "#4285F4" }}>g</Text>
        <Text style={{ color: "#34A853" }}>l</Text>
        <Text style={{ color: "#EA4335" }}>e</Text>
      </Text>
    </View>
  );
}

export default function SignIn() {
  const { signInWithGoogle } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const top = useSafeAreaInsets().top;

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await signInWithGoogle();

      if (res.type === "success") {
        router.replace("/(tabs)/home");
      } else if (res.type === "needs_profile") {
        // New Google account — finish setting up the profile.
        router.replace("/(auth)/signup");
      } else if (res.type === "error") {
        setError(res.error || "Sign-in failed.");
      }
      // cancelled → no-op
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
        <Text className="text-primary text-lg font-sora-bold">Welcome Back</Text>
        <Text className="text-muted text-sm font-sora mt-2 leading-5">
          Sign in to continue your spiritual journey
        </Text>
      </View>

      {/* ERROR */}
      {error ? (
        <View className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl mb-4">
          <Text className="text-red-300 text-xs text-center">{error}</Text>
        </View>
      ) : null}

      {/* GOOGLE BUTTON */}
      <Pressable
        onPress={handleGoogle}
        disabled={loading}
        className="bg-white rounded-xl h-14 items-center justify-center flex-row"
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <>
            <GoogleMark />
            <Text className="text-black font-sora-bold text-sm ml-3">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>

      <Text className="text-muted text-[11px] text-center mt-5 font-sora leading-5 px-6">
        By continuing you agree to our community guidelines. We never post
        without your permission.
      </Text>
    </View>
  );
}

