import { getAnimoji } from "@/constants/avatar";
import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";

const Avatar = ({
  index,
  diameter = 40,
}: {
  index?: number;
  diameter?: number;
}) => {
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
