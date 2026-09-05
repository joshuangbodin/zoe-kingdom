import { Heart, MessageCircle, MoreVertical } from "lucide-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import { useTheme } from "@/context/theme-context";

export type PostCardData = {
  id: string;
  uid: string;
  thought?: string;
  verseReference?: string;
  verseText?: string;
  likesCount?: number;
  commentsCount?: number;
};

export type PostCardProps = {
  item: PostCardData;
  isLiked: boolean;
  username: string;
  avatar: number;
  onLike: () => void;
  onOpenMenu: () => void;
  onOpenVerse: (reference: string) => void;
  onOpenComments: () => void;
};

/** A single post in the feed: author row, thought, scripture card, actions. */
export default function PostCard({
  item,
  isLiked,
  username,
  avatar,
  onLike,
  onOpenMenu,
  onOpenVerse,
  onOpenComments,
}: PostCardProps) {
  const { isDark } = useTheme();
  const ACTION_COLOR = isDark ? "#fff" : "#0c0c0c";

  return (
    <View className="mb-4 mx-4 bg-card-1 p-3 rounded-3xl">
      {/* Author header */}
      <View className="flex-row items-center mb-3 px-0.5">
        <Avatar index={avatar} diameter={32} />
        <View className="ml-2.5 flex-1">
          <Text className="text-primary text-xs font-sora-semibold leading-5">
            {username}
          </Text>
          <Text className="text-tertiary text-[10px] font-sora">
            @{username?.toLowerCase()}
          </Text>
        </View>
        <Pressable onPress={onOpenMenu} className="p-1.5">
          <MoreVertical size={16} color={ACTION_COLOR} />
        </Pressable>
      </View>

      {/* Thought */}
      {item.thought && (
        <Text className="text-primary/85 text-xs leading-6 font-sora mb-3">
          {item.thought}
        </Text>
      )}

      {/* Scripture card */}
      {!!item.verseReference && (
        <Pressable
          onPress={() => onOpenVerse(item.verseReference!)}
          className="bg-card-2 rounded-3xl overflow-hidden active:opacity-80 mb-3"
        >
          <Image
            source={require("@/assets/images/pattern.jpg")}
            className="absolute inset-0 opacity-5  w-full h-full"
            style={{ borderRadius: 24 }}
            resizeMode="cover"
          />
          <View className="p-4">
            <Text className="text-primary text-xs font-sora mb-1.5">
              {item.verseReference}
            </Text>
            <Text className="text-secondary text-xs leading-5 font-serif">
              {item.verseText}
            </Text>
          </View>
          <View className="border-t border-line px-4 py-2">
            <Text className="text-tertiary text-[10px] font-sora">
              Read full chapter →
            </Text>
          </View>
        </Pressable>
      )}

      {/* Actions */}
      <View className="flex-row items-center  pt-3">
        <Pressable onPress={onLike} className="flex-row items-center mr-5">
          <Heart
            color={isLiked ? "#ef4444" : ACTION_COLOR}
            size={17}
            fill={isLiked ? "#ef4444" : "transparent"}
          />
          {(item.likesCount ?? 0) > 0 && (
            <Text className="text-primary text-xs ml-1.5 font-sora">
              {item.likesCount}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={onOpenComments}
          className="flex-row items-center mr-5"
        >
          <MessageCircle color={ACTION_COLOR} size={17} />
          {(item.commentsCount ?? 0) > 0 && (
            <Text className="text-tertiary text-xs ml-1.5 font-sora">
              {item.commentsCount}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
