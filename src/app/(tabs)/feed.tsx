import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  X,
  BookOpen,
  Globe,
} from "lucide-react-native";

import { auth } from "@/libs/firebase";

import Avatar from "@/components/Avatar";
import { createPost, likePost, subscribeToFeed, hasUserLikedPost } from "@/libs/firebase/posts";
import {
  getAllUsersSortedByLastUpload,
  getUserProfile,
  UserProfile,
} from "@/libs/firebase/users";
import { router } from "expo-router";

const TAGS = ["All", "#faith", "#growth", "#love", "#purpose", "#testimony", "#bible", "#prayer"];

export default function Feed() {
  const { top } = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<UserProfile[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTag, setSelectedTag] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const loadStories = async () => {
    try {
      const users = await getAllUsersSortedByLastUpload();
      setUserStories(users);
    } catch (err) {
      console.error("Error loading stories:", err);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const data = await getUserProfile(user.uid);
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToFeed((newPosts) => {
      setPosts(newPosts);
      const user = auth.currentUser;
      if (user) {
        newPosts.forEach(async (post) => {
          const liked = await hasUserLikedPost(post.id, user.uid);
          if (liked) {
            setLikedPosts((prev) => new Set(prev).add(post.id));
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!content.trim() || submitting) return;
    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user) { router.push("/(auth)/signin"); return; }
      await createPost({
        uid: user.uid,
        username: profile?.username ?? "anonymous",
        avatar: profile?.avatar ?? 0,
        spiritStage: profile?.spiritStage ?? "",
        thought: content.trim(),
        tags: ["faith"],
      });
      setContent("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, profile]);

  const handleLike = useCallback(async (postId: string) => {
    const user = auth.currentUser;
    if (!user) { router.push("/(auth)/signin"); return; }
    try {
      await likePost(postId, user.uid);
      setLikedPosts((prev) => new Set(prev).add(postId));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedTag === "All") return posts;
    return posts.filter((post) =>
      post.tags?.some((tag: string) =>
        selectedTag.replace("#", "").toLowerCase() === tag.toLowerCase()
      )
    );
  }, [posts, selectedTag]);

  const openBibleVerse = useCallback((reference: string) => {
    if (!reference) return;
    const match = reference.match(/^(.+?)\s(\d+):(\d+)/);
    if (match) {
      router.push({
        pathname: "/(tabs)/bible",
        params: { book: match[1], chapter: match[2] },
      });
    }
  }, []);

  const renderStory = ({ item, index }: { item: UserProfile; index: number }) => (
    <Pressable className="mr-4 items-center">
      <View className="relative">
        {item.statusNote && (
          <View className="absolute -top-1.5 self-center z-10">
            <View className="bg-card-2 rounded-full px-2 py-0.5 border border-white/5">
              <Text numberOfLines={1} className="text-white/70 text-[7px] font-sora-medium">
                {item.statusNote}
              </Text>
            </View>
          </View>
        )}
        <View className="w-14 h-14 rounded-full items-center justify-center bg-white/5">
          <Avatar index={item.avatar} diameter={50} />
        </View>
      </View>
      <Text numberOfLines={1} className="text-zinc-400 mt-1.5 text-[9px] max-w-14 font-sora text-center">
        @{item.username}
      </Text>
    </Pressable>
  );

  const renderPost = ({ item }: any) => {
    const isLiked = likedPosts.has(item.id);
    const actionColor = "#666";

    return (
      <View className="mb-4">
        {/* User header - minimal */}
        <View className="flex-row items-center mb-3 px-0.5">
          <Avatar index={item.avatar} diameter={32} />
          <View className="ml-2.5 flex-1">
            <Text className="text-white text-[13px] font-sora-semibold leading-5">
              {item.username}
            </Text>
            <Text className="text-zinc-500 text-[10px] font-sora">
              @{item.username?.toLowerCase()}
            </Text>
          </View>
          <Pressable className="p-1.5">
            <MoreHorizontal size={16} color={actionColor} />
          </Pressable>
        </View>

        {/* Thought */}
        {item.thought && (
          <Text className="text-white/85 text-sm leading-6 font-sora mb-3">
            {item.thought}
          </Text>
        )}

        {/* Verse Card */}
        {!!item.verseReference && (
          <Pressable
            onPress={() => openBibleVerse(item.verseReference)}
            className="bg-card-1 rounded-xl overflow-hidden active:opacity-80 mb-3"
          >
            <View className="p-4">
              <View className="flex-row items-center mb-2">
                <BookOpen size={12} color="#fbbf24" />
                <Text className="text-amber-400/70 text-[9px] font-sora-semibold ml-1.5 uppercase tracking-widest">
                  Scripture
                </Text>
              </View>
              <Text className="text-white text-sm font-serif mb-1.5">
                {item.verseReference}
              </Text>
              <Text className="text-zinc-400 text-[12px] leading-6 font-serif">
                {item.verseText}
              </Text>
            </View>
            <View className="border-t border-white/5 px-4 py-2">
              <Text className="text-zinc-500 text-[9px] font-sora">
                Read full chapter →
              </Text>
            </View>
          </Pressable>
        )}

        {/* Actions */}
        <View className="flex-row items-center border-t border-white/5 pt-3">
          <Pressable
            onPress={() => handleLike(item.id)}
            className="flex-row items-center mr-5"
          >
            <Heart
              color={isLiked ? "#ef4444" : actionColor}
              size={17}
              fill={isLiked ? "#ef4444" : "transparent"}
            />
            {item.likesCount > 0 && (
              <Text className="text-zinc-500 text-[11px] ml-1.5 font-sora">
                {item.likesCount}
              </Text>
            )}
          </Pressable>

          <Pressable className="flex-row items-center mr-5">
            <MessageCircle color={actionColor} size={17} />
            {item.commentsCount > 0 && (
              <Text className="text-zinc-500 text-[11px] ml-1.5 font-sora">
                {item.commentsCount}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-5 pb-3 border-b border-white/5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Avatar index={profile?.avatar} diameter={32} />
            <Text className="text-white text-sm font-sora-semibold ml-3">
              Zoe Network
            </Text>
          </View>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
          >
            <Plus color="white" size={16} />
          </Pressable>
        </View>
      </View>

      {/* Stories */}
      <FlatList
        data={userStories}
        renderItem={renderStory}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        keyExtractor={(item, index) => item.uid || index.toString()}
      />

      {/* Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-1"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {TAGS.map((tag) => {
          const active = selectedTag === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(tag)}
              className={`mr-2 px-3.5 py-2 rounded-full ${
                active ? "bg-white" : "bg-card-1"
              }`}
            >
              <Text
                className={`text-[10px] font-sora-medium ${
                  active ? "text-black" : "text-zinc-400"
                }`}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Feed */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140 }}
        ItemSeparatorComponent={() => <View className="h-px bg-white/5 mx-4 my-2" />}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Globe size={32} color="#444" />
            <Text className="text-zinc-500 text-sm font-sora-semibold mt-4">
              No posts yet
            </Text>
            <Text className="text-zinc-600 text-center mt-1.5 px-10 text-[11px] font-sora leading-5">
              Share a thought or scripture with the community.
            </Text>
          </View>
        }
      />

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#0d0d0d] rounded-t-[28px] px-5 pt-5 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-sm font-sora-semibold">New Post</Text>
              <Pressable onPress={() => setShowCreateModal(false)} className="p-1.5">
                <X size={17} color="#fff" />
              </Pressable>
            </View>

            <View className="flex-row items-center mb-4">
              <Avatar index={profile?.avatar} diameter={28} />
              <View className="ml-2.5">
                <Text className="text-white text-[13px] font-sora-semibold">
                  {profile?.username || "You"}
                </Text>
                <Text className="text-zinc-500 text-[9px] font-sora">
                  {profile?.spiritStage || "Kindled Flame"}
                </Text>
              </View>
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Share a thought..."
              placeholderTextColor="#444"
              multiline
              className="bg-card-1 rounded-xl px-4 py-3.5 text-white/85 font-sora text-sm leading-6 min-h-[90px]"
              textAlignVertical="top"
            />

            <Pressable
              onPress={() => { setShowCreateModal(false); router.push("/(tabs)/bible"); }}
              className="flex-row items-center mt-3 bg-card-1 rounded-xl px-4 py-3"
            >
              <BookOpen size={14} color="#fbbf24" />
              <Text className="text-zinc-400 text-[11px] font-sora-medium ml-2.5">
                Add a Bible verse
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCreatePost}
              disabled={submitting || !content.trim()}
              className={`mt-4 rounded-xl py-3.5 items-center ${
                content.trim() ? "bg-white" : "bg-card-1"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="black" />
              ) : (
                <View className="flex-row items-center">
                  <Send size={13} color={content.trim() ? "black" : "#555"} />
                  <Text className={`ml-2 font-sora-semibold text-[11px] ${content.trim() ? "text-black" : "text-zinc-500"}`}>
                    Post
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}