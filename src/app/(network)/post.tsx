import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "@/libs/firebase";

import {
  ChevronLeft,
  Heart,
  BookOpen,
  Send,
} from "lucide-react-native";
import Avatar from "@/components/Avatar";
import {
  createComment,
  hasUserLikedPost,
  likePost,
  subscribeToComments,
} from "@/libs/firebase/posts";
import { getUserProfile, UserProfile } from "@/libs/firebase/users";

export default function PostDetail() {
  const { id, uid, thought, verseText, verseReference, likesCount } =
    useLocalSearchParams<{
      id: string;
      uid: string;
      thought: string;
      verseText: string;
      verseReference: string;
      likesCount: string;
    }>();

  const { top } = useSafeAreaInsets();
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);

  // Load author from uid
  useEffect(() => {
    if (uid) {
      getUserProfile(uid).then(setAuthor);
    }
  }, [uid]);

  // Load current user profile
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getUserProfile(user.uid).then(setCurrentProfile);
  }, []);

  // Check if liked
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !id) return;
    hasUserLikedPost(id, user.uid).then(setIsLiked);
  }, [id]);

  // Subscribe to comments
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToComments(id, setComments);
    return () => unsub();
  }, [id]);

  const handleLike = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !id) return;
    await likePost(id, user.uid);
    setIsLiked(true);
  }, [id]);

  const handleComment = useCallback(async () => {
    if (!commentText.trim() || submitting || !id) return;
    const user = auth.currentUser;
    if (!user) {
      router.push("/(auth)/signin");
      return;
    }
    try {
      setSubmitting(true);
      const p = currentProfile || (await getUserProfile(user.uid));
      await createComment(id, {
        uid: user.uid,
        username: p?.username || "anonymous",
        avatar: p?.avatar ?? 0,
        text: commentText.trim(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Error commenting:", err);
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, id, currentProfile]);

  const openBibleVerse = useCallback((reference: string) => {
    if (!reference) return;
    const match = reference.match(/^(.+?)\s(\d+):(\d+)/);
    if (match) {
      router.push({
        pathname: "/(tabs)/bible",
        params: { book: match[1], chapter: match[2], verse: match[3] },
      });
    }
  }, []);

  const renderComment = ({ item }: any) => (
    <View className="flex-row items-start mb-5">
      <Avatar index={item.avatar} diameter={28} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-white text-xs font-sora-semibold">
            {item.username}
          </Text>
          <Text className="text-zinc-600 text-[9px] font-sora ml-2">
            {item.createdAt?.toDate
              ? new Date(item.createdAt.toDate()).toLocaleDateString()
              : ""}
          </Text>
        </View>
        <Text className="text-zinc-300 text-sm font-sora leading-5">
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View style={{ paddingTop: top + 10 }} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-5 pb-3 border-b border-white/5">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-card-2 items-center justify-center mr-3"
          >
            <ChevronLeft color="white" size={17} />
          </Pressable>
          <Text className="text-white text-base font-sora-semibold">Post</Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              {/* Post Content */}
              <View className="mb-6 bg-card-1 p-4 rounded-xl">
                {/* Author */}
                <View className="flex-row items-center mb-3">
                  <Avatar index={author?.avatar} diameter={32} />
                  <View className="ml-2.5">
                    <Text className="text-white text-[13px] font-sora-semibold">
                      {author?.username || "Loading..."}
                    </Text>
                    <Text className="text-zinc-500 text-[10px] font-sora">
                      @{author?.username?.toLowerCase() || "..."}
                    </Text>
                  </View>
                </View>

                {/* Thought */}
                {thought && (
                  <Text className="text-white/85 text-sm leading-6 font-sora mb-3">
                    {thought}
                  </Text>
                )}

                {/* Verse Card */}
                {!!verseReference && (
                  <Pressable
                    onPress={() => openBibleVerse(verseReference)}
                    className="bg-card-2 rounded-xl overflow-hidden active:opacity-80 mb-3"
                  >
                    <View className="p-4">
                      <View className="flex-row items-center mb-2">
                        <BookOpen size={12} color="#fbbf24" />
                        <Text className="text-amber-400/70 text-[9px] font-sora-semibold ml-1.5 uppercase tracking-widest">
                          Scripture
                        </Text>
                      </View>
                      <Text className="text-white text-sm font-serif mb-1.5">
                        {verseReference}
                      </Text>
                      <Text className="text-zinc-400 text-[12px] leading-6 font-serif">
                        {verseText}
                      </Text>
                    </View>
                  </Pressable>
                )}

                {/* Like */}
                <View className="flex-row items-center border-t border-white/5 pt-3">
                  <Pressable
                    onPress={handleLike}
                    className="flex-row items-center"
                  >
                    <Heart
                      color={isLiked ? "#ef4444" : "#666"}
                      size={17}
                      fill={isLiked ? "#ef4444" : "transparent"}
                    />
                    {parseInt(likesCount || "0") > 0 && (
                      <Text className="text-zinc-500 text-[11px] ml-1.5 font-sora">
                        {likesCount}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Comments Header */}
              <Text className="text-white text-sm font-sora-semibold mb-4">
                Comments ({comments.length})
              </Text>
            </>
          }
          ListEmptyComponent={
            <View className="items-center pt-8">
              <Text className="text-zinc-500 text-xs font-sora">
                No comments yet. Be the first to share your thoughts.
              </Text>
            </View>
          }
        />

        {/* Comment Input */}
        <View className="px-5 pb-8 pt-3 border-t border-white/5 bg-bg">
          <View className="flex-row items-center bg-card-1 rounded-xl px-4 py-2.5">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#555"
              className="flex-1 text-white/80 text-xs font-sora"
            />
            <Pressable
              onPress={handleComment}
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#888" />
              ) : (
                <Send
                  size={16}
                  color={commentText.trim() ? "#fbbf24" : "#444"}
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}