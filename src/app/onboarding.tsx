import { useApp } from "@/context/app-context";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const man = require("@/assets/images/man.png");
const woman = require("@/assets/images/woman.png");

export default function Onboarding() {
  const router = useRouter();
  const StyledSafeAreaView = withUniwind(SafeAreaView);
  const { continueAsGuest } = useApp();

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    router.replace("/(tabs)/home");
  };

  return (
    <StyledSafeAreaView className="flex-1 relative bg-bg pt-8 px-4 ">
      {/* BRAND SECTION */}
      <View className=" mb-9">
        <View>
          <Text className="text-primary/80 text-[33px]  font-sora-bold">
            Consistent
          </Text>
          <Text className="text-primary/80 text-[33px]  font-sora-bold">
            <Text className="text-primary">Christian</Text> Spiritual
          </Text>

          <Text className="text-primary/80 text-[33px]  font-sora-bold">
            Growth <Text className="text-primary">With my Zoe</Text>
          </Text>

          <Text className="text-primary/80 text-[33px]  font-sora-bold">
            <Text className="text-primary">Life</Text> App
          </Text>
        </View>

        <Text className="text-primary/80  mt-8 text-base font-sora leading-7.5 ">
          Grow your Spirit Man.{"\n"}
          Join the community & Share thought.{"\n"}
          Build Holy Habits.
        </Text>
      </View>

      {/* PRIMARY ACTION */}
      <Pressable
        onPress={() => router.push("/(auth)/signin")}
        className="bg-primary py-4 z-10 rounded-xl items-center"
      >
        <Text className="text-bg font-semibold text-base">Get Started</Text>
      </Pressable>
      {/* <Pressable
        onPress={() => router.push("/(auth)/signin")}
        className="bg-card-2 mt-3 py-4 z-10 rounded-xl items-center"
      >
        <Text className="text-primary font-semibold text-base">
          Sign in with Google
        </Text>
      </Pressable> */}

      <Pressable
        onPress={handleContinueAsGuest}
        className="mt-4 py-2 z-10 items-center"
      >
        <Text className="text-primary/80 font-sora text-xs underline">
          Continue without an account
        </Text>
      </Pressable>

      <Animated.Image
        entering={FadeInDown}
        className={"absolute -bottom-5"}
        source={man}
      />
      <Animated.Image
        entering={FadeInDown}
        className={" absolute -bottom-5 right-0"}
        source={woman}
      />
    </StyledSafeAreaView>
  );
}
