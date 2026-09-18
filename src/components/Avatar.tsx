import { getAnimoji } from "@/constants/avatar";
import { useTheme } from "@/context/theme-context";

import { Image } from "expo-image";
import { UserCircle } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

const Avatar = ({
  index,
  diameter = 40,
}: {
  index?: number;
  diameter?: number;
}) => {
  const { isDark } = useTheme();

  if (!index)
    return (
      <View className="">
        <UserCircle size={diameter * 0.8} color={isDark ? "#ooo" : "#000"} />
      </View>
    );
  return (
    <View>
      <Image
        style={{
          width: diameter,
          height: diameter,
          borderRadius: 2000,
        }}
        source={getAnimoji(index || 0)}
      />
    </View>
  );
};

export default Avatar;
