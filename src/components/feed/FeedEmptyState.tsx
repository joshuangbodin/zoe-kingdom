import React from "react";
import { Text, View } from "react-native";
import { Globe } from "lucide-react-native";

/** Shown when there are no posts matching the current filter. */
export default function FeedEmptyState() {
  return (
    <View className="flex-1 items-center justify-center pt-24">
      <Globe size={34} color="#444" />
      <Text className="text-tertiary text-sm font-sora-semibold mt-4">
        No posts yet
      </Text>
      <Text className="text-quaternary text-center mt-2 px-10 text-xs leading-5 font-sora">
        Share a thought or scripture with the community.
      </Text>
    </View>
  );
}