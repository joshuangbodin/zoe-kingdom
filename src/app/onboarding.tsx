import { useApp } from "@/context/app-context";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const man = require("@/assets/images/Frame.png");


const StyledSafeAreaView = withUniwind(SafeAreaView);

export default function Onboarding() {
  const router = useRouter();
  const { continueAsGuest } = useApp();

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    router.replace("/(tabs)/home");
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-black  justify-between">
      {/* HERO IMAGES SECTION (TOP) */}
      <View className="flex-1 relative justify-end  items-center overflow-hidden">
        <View className="flex-row justify-center items-end w-full  -mb-4">
          <Animated.Image
            entering={FadeInUp.duration(600)}
            className="flex-1 resize-contain  z-10"
            source={man}
          />
         
        </View>
      </View>

      {/* CONTENT SHEET (BOTTOM) */}
      <Animated.View 
        entering={FadeInDown.duration(600)}
        className="bg-bg rounded-t-4xl px-6 pt-8 pb-6 justify-between"
      >
        {/* BRAND TITLE & TAGLINES */}
        <View className="mb-8">
          <Text className="text-3xl font-sora-bold text-primary ">
            Consistent{"\n"}
            <Text className="text-primary-muted">Christian </Text>Spiritual{"\n"}
            Growth <Text className="text-primary-muted">with My Zoe</Text>{"\n"}
            Life <Text className="text-primary-muted">App</Text>
          </Text>

          <View className="mt-6 gap-2">
            <Text className="text-primary/70 text-sm font-sora">
               Spiritual Activity Tracker
            </Text>
            <Text className="text-primary/70 text-sm font-sora">
               Join the community
            </Text>
            <Text className="text-primary/70 text-sm font-sora">
               Bible and thought journaling
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View className="w-full space-y-3">
          <Pressable
            onPress={() => router.push("/(auth)/signin")}
            className="bg-white py-4 rounded-full items-center active:opacity-90"
          >
            <Text className="text-black font-sora-bold text-base">
              Get Started
            </Text>
          </Pressable>

          <Pressable
            onPress={handleContinueAsGuest}
            className="py-3 items-center"
          >
            <Text className="text-primary/60 font-sora text-xs underline">
              Continue without an account
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </StyledSafeAreaView>
  );
}