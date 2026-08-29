import React from "react";
import { Pressable, ScrollView, Text } from "react-native";

export type TagFilterProps = {
  tags: string[];
  selected: string;
  onSelect: (tag: string) => void;
};

/** Horizontally scrollable row of filtered tag chips. */
export default function TagFilter({ tags, selected, onSelect }: TagFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
    >
      {tags.map((tag) => {
        const active = selected === tag;
        return (
          <Pressable
            key={tag}
            onPress={() => onSelect(tag)}
            className={`mr-2 px-3.5 h-8 py-2 rounded-full ${
              active ? "bg-white" : "bg-card-1"
            }`}
          >
            <Text
              className={`text-[10px] font-sora-medium ${
                active ? "text-black" : "text-secondary"
              }`}
            >
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}