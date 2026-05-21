import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { createPost, likePost, subscribeToFeed } from "@/libs/firebase/posts";

import { auth } from "@/libs/firebase";

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /**
   * Subscribe to realtime feed
   */
  useEffect(() => {
    const unsubscribe = subscribeToFeed(setPosts);
    return () => unsubscribe();
  }, []);

  /**
   * Create new post
   */
  const handleCreatePost = useCallback(async () => {
    if (!content.trim() || submitting) {
      console.log("not allowed");
      return;
    }

    console.log("sharing...");

    try {
      setSubmitting(true);

      const user = auth.currentUser;
      if (!user) return;

      await createPost(user.uid, content.trim());

      setContent("");
    } catch (error) {
      console.error("Create post error:", error);
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting]);

  /**
   * Render single post
   */
  const renderPost = ({ item }: any) => {
    return (
      <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        {/* POST CONTENT */}
        <Text className="text-base text-gray-900 leading-5">{item.text}</Text>

        {/* META */}
        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-gray-400 text-sm">
            ❤️ {item.likesCount || 0}
          </Text>

          <Pressable
            onPress={() => likePost(item.id)}
            className="bg-green-600 px-4 py-2 rounded-xl"
          >
            <Text className="text-white text-sm font-medium">Like</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-50"
    >
      {/* HEADER SECTION */}
      <View className="px-5 pt-16 pb-4 bg-white border-b border-gray-100">
        <Text className="text-3xl font-bold text-green-700">
          Kingdom Feed 🔥
        </Text>

        <Text className="text-gray-500 mt-1">
          Share your thoughts, testimonies, and prayers
        </Text>

        {/* CREATE POST INPUT */}
        <View className="mt-5 bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <TextInput
            placeholder="What is God placing on your heart?"
            value={content}
            onChangeText={setContent}
            multiline
            className="text-base text-gray-900 min-h-[80px]"
          />

          <Pressable
            onPress={handleCreatePost}
            disabled={submitting}
            className={`mt-3 py-3 rounded-2xl items-center ${
              submitting ? "bg-green-400" : "bg-green-600"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Share Thought</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* FEED LIST */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}
