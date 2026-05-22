import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, SlideInDown, SlideInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const man = require("@/assets/images/man.png");
const woman = require("@/assets/images/woman.png");

export default function Onboarding() {
  const router = useRouter();
  const StyledSafeAreaView = withUniwind(SafeAreaView);

  return (
    <StyledSafeAreaView className="flex-1 relative bg-neutral-950 pt-8 px-4 ">
      {/* BRAND SECTION */}
      <View className=" mb-9">
        <View>
          <Text className="text-muted text-[33px]  font-sora-bold">
            Consistent
          </Text>
          <Text className="text-muted text-[33px]  font-sora-bold">
            <Text className="text-white">Christian</Text> Spiritual
          </Text>

          <Text className="text-muted text-[33px]  font-sora-bold">
            Growth <Text className="text-white">With my Zoe</Text>
          </Text>

          <Text className="text-muted text-[33px]  font-sora-bold">
            <Text className="text-white">Life</Text> App
          </Text>
        </View>

        <Text className="text-muted  mt-8 text-base font-sora leading-[30px] ">
          Grow your Spirit Man.{"\n"}
          Join the community & Share thought.{"\n"}
          Build Holy Habits.
        </Text>
      </View>

      {/* PRIMARY ACTION */}
      <Pressable
        onPress={() => router.push("/(auth)/signin")}
        className="bg-white py-4 rounded-xl items-center"
      >
        <Text className="text-black font-semibold text-base">Get Started</Text>
      </Pressable>

      <Animated.Image entering={FadeInDown} className={"absolute bottom-0"} source={man}/>
      <Animated.Image entering={FadeInDown}  className={" absolute bottom-0 right-0"} source={woman}/>

    </StyledSafeAreaView>
  );
}
