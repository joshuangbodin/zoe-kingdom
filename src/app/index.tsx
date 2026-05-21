import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black px-6 justify-center">

      {/* BRAND SECTION */}
      <View className="items-center mb-12">

        <Text className="text-4xl font-bold text-white tracking-wide">
          Zoe Kingdom
        </Text>

        <Text className="text-2xl mt-1">
          👑
        </Text>

        <Text className="text-gray-400 text-center mt-4 leading-5">
          Grow your spirit man.{"\n"}
          Build holy habits.{"\n"}
          Walk in consistency.
        </Text>

      </View>

      {/* PRIMARY ACTION */}
      <Pressable
        onPress={() => router.push("/(auth)/signin")}
        className="bg-white py-4 rounded-2xl items-center"
      >
        <Text className="text-black font-semibold text-base">
          Enter Kingdom
        </Text>
      </Pressable>

      {/* SECONDARY ACTION */}
      <Pressable
        onPress={() => router.push("/(auth)/signup")}
        className="mt-5 items-center"
      >
        <Text className="text-gray-400">
          New here? Start your journey →
        </Text>
      </Pressable>

      {/* FOOTNOTE */}
      <Text className="text-gray-600 text-xs text-center mt-10">
        A discipline-based spiritual growth system
      </Text>

    </View>
  );
}