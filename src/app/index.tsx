import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      
      {/* Logo / Title */}
      <Text className="text-3xl font-bold text-white">
        Zoe Kingdom 👑
      </Text>

      {/* Subtitle */}
      <Text className="text-gray-500 mt-2 text-center">
        Grow your spirit man. Build holy habits. Walk in consistency.
      </Text>

      {/* Spacer */}
      <View className="h-10" />

      {/* Entry Button */}
      <Pressable
        onPress={() => router.push("/(tabs)/home")}
        className="bg-white px-6 py-3 rounded-2xl"
      >
        <Text className="text-black font-semibold">
          Enter Kingdom
        </Text>
      </Pressable>

      {/* Secondary action (future onboarding) */}
      <Pressable
        onPress={() => console.log("onboarding later")}
        className="mt-4"
      >
        <Text className="text-gray-400">
          New here? Start your journey
        </Text>
      </Pressable>
    </View>
  );
}