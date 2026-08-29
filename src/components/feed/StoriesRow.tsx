import React from "react";
import { FlatList, View } from "react-native";

import StoryAvatar, { StoryUser } from "@/components/feed/StoryAvatar";

export type StoriesRowProps = {
  users: StoryUser[];
  onSelect?: (user: StoryUser) => void;
};

/** Horizontal scrollable status banner of colourful story rings. */
export default function StoriesRow({ users, onSelect }: StoriesRowProps) {
  return (
    <View>
      <FlatList
        data={users}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.uid ?? index.toString()}
        renderItem={({ item, index }) => (
          <StoryAvatar user={item} index={index} onPress={onSelect} />
        )}
        contentContainerStyle={{ paddingVertical: 14, paddingHorizontal: 16 }}
      />
    </View>
  );
}