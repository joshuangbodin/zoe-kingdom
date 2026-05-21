import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";

import {
  subscribeToFeed,
  likePost,
} from "@/libs/firebase/posts";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToFeed(setPosts);

    return () => unsubscribe();
  }, []);

  return (
    <View className="flex-1 bg-white px-5 pt-16">

      {/* HEADER */}
      <Text className="text-3xl font-bold text-green-700">
        Kingdom Feed 🔥
      </Text>

      <Text className="text-gray-500 mt-1">
        Share your thoughts, testimonies, and prayers
      </Text>

      {/* POSTS */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View className="border border-gray-200 rounded-3xl p-5 mb-4">

            {/* TEXT */}
            <Text className="text-base text-black">
              {item.text}
            </Text>

            {/* META */}
            <Text className="text-gray-400 mt-2 text-sm">
              ❤️ {item.likesCount || 0}
            </Text>

            {/* ACTION */}
            <Pressable
              onPress={() => likePost(item.id)}
              className="bg-green-600 mt-4 py-2 rounded-xl items-center"
            >
              <Text className="text-white font-medium">
                Like
              </Text>
            </Pressable>

          </View>
        )}
      />
    </View>
  );
}