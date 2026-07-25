import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  MoreVertical,
  Plus,
  Search,
  Send,
  X,
  BookOpen,
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

  /* Realtime feed */
  useEffect(() => {
    const unsubscribe = subscribeToFeed((newPosts) => {
      setPosts(newPosts);
      // Check which posts the current user has liked
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

  /* Create post */
  const handleCreatePost = useCallback(async () => {
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user) {
        router.push("/(auth)/signin");
        return;
      }

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

  /* Like handler */
  const handleLike = useCallback(async (postId: string) => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/(auth)/signin");
      return;
    }
    try {
      await likePost(postId, user.uid);
      setLikedPosts((prev) => new Set(prev).add(postId));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  }, []);

  /* Filtered posts */
  const filteredPosts = useMemo(() => {
    if (selectedTag === "All") return posts;
    return posts.filter((post) =>
      post.tags?.some((tag: string) =>
        selectedTag.replace("#", "").toLowerCase() === tag.toLowerCase()
      )
    );
  }, [posts, selectedTag]);

  /* Navigate to Bible verse */
  const openBibleVerse = useCallback((reference: string) => {
    if (!reference) return;
    // Parse "Book Chapter:Verse" format
    const match = reference.match(/^(.+?)\s(\d+):(\d+)/);
    if (match) {
      router.push({
        pathname: "/(tabs)/bible",
        params: {
          book: match[1],
          chapter: match[2],
        },
      });
    }
  }, []);

  /* Render story */
  const renderStory = ({ item, index }: { item: UserProfile; index: number }) => (
    <Pressable
      onPress={() => {
        if (item.uid) {
          // Navigate to user's profile or posts
        }
      }}
      className="mr-5 items-center"
    >
      <View className="overflow-visible">
        {item.statusNote && (
          <View className="absolute -top-2 self-center z-50">
            <View className="bg-card-2 rounded-full px-2.5 py-1 border border-white/10">
              <Text
                numberOfLines={1}
                className="text-white text-[9px] font-sora-medium"
              >
                {item.statusNote}
              </Text>
            </View>
          </View>
        )}

        <View
          className="w-20 h-20 rounded-full items-center justify-end"
          style={{
            backgroundColor: [
              "#FACC15", "#FB923C", "#06B6D4", "#F43F5E", "#14B8A6",
            ][index % 5],
          }}
        >
          <Avatar index={item.avatar} diameter={70} />
        </View>
      </View>

      <Text
        numberOfLines={1}
        className="text-white mt-3 text-[10px] max-w-20 truncate font-sora"
      >
        @{item.username}
      </Text>
    </Pressable>
  );

  /* Render post */
  const renderPost = ({ item }: any) => {
    const isLiked = likedPosts.has(item.id);

    return (
      <View className="bg-card-1 rounded-[34px] p-6 mb-5">
        {/* User header */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1">
            <Avatar index={item.avatar} />
            <View className="ml-4 flex-1">
              <Text className="text-white text-lg font-sora-semibold">
                {item.username}
              </Text>
              <Text className="text-muted text-sm mt-1">
                @{item.username?.toLowerCase()}
              </Text>
            </View>
          </View>
          <Pressable className="p-2">
            <MoreVertical size={20} color="white" />
          </Pressable>
        </View>

        {/* Thought */}
        {item.thought && (
          <Text className="text-white text-[17px] leading-8 mt-8 font-sora">
            {item.thought}
          </Text>
        )}

        {/* Verse Card - Tappable to open Bible */}
        {!!item.verseReference && (
          <Pressable
            onPress={() => openBibleVerse(item.verseReference)}
            className="bg-card-2 rounded-[30px] mt-6 overflow-hidden active:opacity-80"
          >
            <View className="p-6">
              <View className="flex-row items-center mb-3">
                <BookOpen size={16} color="#fbbf24" />
                <Text className="text-amber-300 text-sm font-sora-semibold ml-2">
                  Scripture
                </Text>
              </View>
              <Text className="text-white text-2xl font-serif mb-3">
                {item.verseReference}
              </Text>
              <Text className="text-zinc-300 leading-9 text-[17px] font-serif">
                {item.verseText}
              </Text>
            </View>
            <View className="bg-white/10 px-6 py-3">
              <Text className="text-white/60 text-xs font-sora">
                Tap to read full chapter →
              </Text>
            </View>
          </Pressable>
        )}

        {/* Actions */}
        <View className="flex-row items-center mt-7">
          <Pressable
            onPress={() => handleLike(item.id)}
            className="mr-6 flex-row items-center"
          >
            <Heart
              color={isLiked ? "#ef4444" : "white"}
              size={28}
              fill={isLiked ? "#ef4444" : "transparent"}
            />
            {item.likesCount > 0 && (
              <Text className="text-white text-xs ml-2 font-sora">
                {item.likesCount}
              </Text>
            )}
          </Pressable>

          <Pressable className="flex-row items-center">
            <MessageCircle color="white" size={26} />
            {item.commentsCount > 0 && (
              <Text className="text-white text-xs ml-2 font-sora">
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
      <View className="px-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Avatar index={profile?.avatar} />
            <View className="w-4 h-4 rounded-full bg-green-500 absolute bottom-0 right-0 border-[2px] border-bg" />
          </View>
          <Text className="text-white text-lg font-sora-bold">
            The Zoe Network
          </Text>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-xl bg-white items-center justify-center"
          >
            <Plus color="black" size={24} />
          </Pressable>
        </View>

        {/* Search */}
        <View className="mt-6 bg-card-1 rounded-xl px-5 py-4 flex-row items-center">
          <Search color="#888" size={24} />
          <TextInput
            placeholder="Search Scripture, interest or thought"
            placeholderTextColor="#888"
            className="ml-4 flex-1 text-white text-sm font-sora"
          />
        </View>
      </View>

      {/* Stories */}
      <FlatList
        data={userStories}
        renderItem={renderStory}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 }}
        keyExtractor={(item, index) => item.uid || index.toString()}
      />

      {/* Tags */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-6"
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {TAGS.map((tag) => {
          const active = selectedTag === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(tag)}
              className={`mr-3 px-5 py-3 rounded-full ${
                active ? "bg-white" : "bg-card-1"
              }`}
            >
              <Text
                className={`text-sm font-sora-medium ${
                  active ? "text-black" : "text-zinc-300"
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
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 180,
        }}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-white text-xl font-sora-bold">
              No posts yet
            </Text>
            <Text className="text-muted text-center mt-3 px-10 leading-6 font-sora">
              Be the first to share a thought or scripture with The Zoe Network.
            </Text>
          </View>
        }
      />

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[40px] px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-sora-bold">
                Share a Thought
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)} className="p-2">
                <X size={22} color="#fff" />
              </Pressable>
            </View>

            {/* User info */}
            <View className="flex-row items-center mb-4">
              <Avatar index={profile?.avatar} />
              <View className="ml-3">
                <Text className="text-white font-sora-semibold">
                  {profile?.username || "You"}
                </Text>
                <Text className="text-muted text-xs font-sora">
                  {profile?.spiritStage || "Kindled Flame"}
                </Text>
              </View>
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's on your heart?"
              placeholderTextColor="#666"
              multiline
              className="bg-card-1 rounded-[28px] px-5 py-5 text-white font-sora text-[16px] leading-7 min-h-[120px]"
              textAlignVertical="top"
            />

            {/* Add verse button */}
            <Pressable
              onPress={() => {
                setShowCreateModal(false);
                router.push("/(tabs)/bible");
              }}
              className="flex-row items-center mt-4 bg-card-1 rounded-2xl px-5 py-4"
            >
              <BookOpen size={20} color="#fbbf24" />
              <Text className="text-white font-sora-medium ml-3">
                Add a Bible verse
              </Text>
            </Pressable>

            {/* Post button */}
            <Pressable
              onPress={handleCreatePost}
              disabled={submitting || !content.trim()}
              className={`mt-6 rounded-2xl py-4 items-center ${
                content.trim() ? "bg-white" : "bg-card-1"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="black" />
              ) : (
                <View className="flex-row items-center">
                  <Send size={18} color={content.trim() ? "black" : "#666"} />
                  <Text
                    className={`ml-2 font-sora-bold text-sm ${
                      content.trim() ? "text-black" : "text-muted"
                    }`}
                  >
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