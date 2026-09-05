import React from "react";
import { Pressable, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import { getStoryColor } from "@/constants/feed";

/** A single story/status ring in the feed's status banner. */
export type StoryUser = {
  uid?: string;
  username?: string;
  avatar?: number;
  statusNote?: string;
};

export type StoryAvatarProps = {
  user: StoryUser;
  index?: number;
  onPress?: (user: StoryUser) => void;
};

export default function StoryAvatar({ user, index = 0, onPress }: StoryAvatarProps) {
  const color = getStoryColor(user.uid ?? index);
  const statusNote = user.statusNote;
  const hasNote = !!statusNote;

  return (
    <Pressable
      disabled={!hasNote}
      onPress={() => onPress?.(user)}
      className="mr-4 items-center"
    >
      <View className="relative">
        {hasNote && statusNote && (
          <View className="absolute -top-2 self-center z-10  px-1.5 pb-0.5">
            <View className="bg-card-2 rounded-full px-2 py-1 border border-line">
              <Text
                numberOfLines={1}
                className="text-primary/70 text-[8px] font-sora-medium max-w-15"
              >
                {statusNote.length > 10
                  ? statusNote.slice(0, 10) + "…"
                  : statusNote}
              </Text>
            </View>
          </View>
        )}

        {/* Colored ring wraps the avatar for a colourful, vibrant look */}
        <View
          className="w-18 h-18 rounded-full items-center justify-end"
          style={{ backgroundColor: color }}
        >
          <View className="">
            <Avatar index={user.avatar ?? index} diameter={60} />
          </View>
        </View>
      </View>

      <Text
        numberOfLines={1}
        className="text-secondary mt-1.5 text-[10px] max-w-14 font-sora text-center"
      >
        @{user.username ?? "user"}
      </Text>
    </Pressable>
  );
}