import React from "react";
import { View, Text, Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import Avatar from "@/components/Avatar";

export interface FeedHeaderProps {
  username?: string;
}

export default function FeedHeader({ username }: FeedHeaderProps) {
  return (
    <View className="px-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Avatar />
          <View className="w-4 h-4 rounded-full bg-green-500 absolute bottom-0 right-0 border-[2px] border-bg" />
        </View>

        <Text className="text-primary text-lg font-sora-bold">
          The Zoe Network
        </Text>

        <Pressable className="p-2">
          <Plus color="white" size={34} />
        </Pressable>
      </View>
    </View>
  );
}
