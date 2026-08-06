import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
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
  BookOpen,
  Globe,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react-native";

import { auth } from "@/libs/firebase";
import { onSnapshot, collection, doc } from "firebase/firestore";
import { db } from "@/libs/firebase";

import Avatar from "@/components/Avatar";
import { useToast } from "@/components/Toast";
import {
  deletePostSmart,
  hasUserLikedPost,
  likePost,
  subscribeToFeed,
  updatePostSmart,
} from "@/libs/firebase/posts";
import { useApp } from "@/context/app-context";
import {
  getAllUsersSortedByLastUpload,
  getUserProfile,
  UserProfile,
} from "@/libs/firebase/users";
import { router } from "expo-router";

const TAGS = [
  "All",
  "#faith",
  "#growth",
  "#love",
  "#purpose",
  "#testimony",
  "#bible",
  "#prayer",
];

/* ---------------------------- USER CACHE ---------------------------- */
// A simple hook that subscribes to user profile changes in real-time
function useUserCache(uids: string[]): Map<string, UserProfile> {
  const [cache, setCache] = useState<Map<string, UserProfile>>(new Map());

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const uniqueUids = [...new Set(uids.filter(Boolean))];

    for (const uid of uniqueUids) {
      const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
        if (snap.exists()) {
          setCache((prev) => {
            const next = new Map(prev);
            next.set(uid, snap.data() as UserProfile);
            return next;
          });
        }
      });
      unsubs.push(unsub);
    }

    return () => unsubs.forEach((fn) => fn());
  }, [JSON.stringify([...new Set(uids.filter(Boolean))].sort())]);

  return cache;
}

export default function Feed() {
  const { top } = useSafeAreaInsets();
  const { user: currentUser, isOnline } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<UserProfile[]>([]);
  const [selectedTag, setSelectedTag] = useState("All");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [statusNoteModalVisible, setStatusNoteModalVisible] = useState(false);
  const [selectedStatusNote, setSelectedStatusNote] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  // Creator edit/delete state
  const [editPost, setEditPost] = useState<any>(null);
  const [editText, setEditText] = useState("");

  // Collect all unique uids from posts for user cache
  const postUids = useMemo(
    () => posts.map((p: any) => p.uid),
    [posts],
  );
  const userCache = useUserCache(postUids);

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
        newPosts.forEach(async (post: any) => {
          const liked = await hasUserLikedPost(post.id, user.uid);
          if (liked) {
            setLikedPosts((prev) => new Set(prev).add(post.id));
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/(auth)/signin");
      return;
    }
    try {
      await likePost(postId, user.uid);
      setLikedPosts((prev) => new Set(prev).add(postId));
      showToast("Post liked!", "success");
    } catch (err) {
      console.error("Error liking post:", err);
      showToast("Failed to like post", "error");
    }
  }, [showToast]);

  const openPostMenu = useCallback(
    (post: any) => {
      if (!currentUser || post.uid !== currentUser.uid) return;
      Alert.alert("Your Post", "What would you like to do?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            setEditText(post.thought || "");
            setEditPost(post);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Delete Post", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deletePostSmart(post.id, post.uid, isOnline);
                    showToast("Post deleted", "success");
                  } catch (e) {
                    console.error(e);
                    showToast("Could not delete post", "error");
                  }
                },
              },
            ]);
          },
        },
      ]);
    },
    [currentUser, isOnline, showToast],
  );

  const saveEditedPost = useCallback(async () => {
    if (!editPost) return;
    if (!editText.trim()) {
      showToast("Post can't be empty", "error");
      return;
    }
    try {
      await updatePostSmart(editPost.id, editPost.uid, editText.trim(), isOnline);
      showToast("Post updated", "success");
      setEditPost(null);
    } catch (e) {
      console.error(e);
      showToast("Could not update post", "error");
    }
  }, [editPost, editText, isOnline, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStories();
    setRefreshing(false);
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedTag === "All") return posts;
    return posts.filter((post: any) =>
      post.tags?.some(
        (tag: string) =>
          selectedTag.replace("#", "").toLowerCase() === tag.toLowerCase(),
      ),
    );
  }, [posts, selectedTag]);

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

  const renderStory = ({
    item,
    index,
  }: {
    item: UserProfile;
    index: number;
  }) => (
    <Pressable
      onPress={() => {
        if (item.statusNote) {
          setSelectedStatusNote(item.statusNote);
          setStatusNoteModalVisible(true);
        }
      }}
      className="mr-4 items-center"
    >
      <View className="relative">
        {item.statusNote && (
          <View className="absolute -top-1.5 self-center z-10">
            <View className="bg-card-2 rounded-full px-2 py-0.5 border border-white/5">
              <Text
                numberOfLines={1}
                className="text-white/70 text-[8px] font-sora-medium max-w-[60px]"
              >
                {item.statusNote.length > 10
                  ? item.statusNote.slice(0, 10) + "…"
                  : item.statusNote}
              </Text>
            </View>
          </View>
        )}
        <View className="w-14 h-14 rounded-full items-center justify-center bg-white/5">
          <Avatar index={item.avatar} diameter={50} />
        </View>
      </View>
      <Text
        numberOfLines={1}
        className="text-zinc-400 mt-1.5 text-[10px] max-w-14 font-sora text-center"
      >
        @{item.username}
      </Text>
    </Pressable>
  );

  const renderPost = ({ item }: any) => {
    const isLiked = likedPosts.has(item.id);
    const actionColor = "#666";

    // Resolve user data from cache — this updates in real-time
    const userData = userCache.get(item.uid);
    const username = userData?.username ?? "anonymous";
    const avatar = userData?.avatar ?? 0;

    return (
      <View className="mb-4 bg-card-1 p-3 rounded-lg">
        {/* User header - minimal */}
        <View className="flex-row items-center mb-3 px-0.5">
          <Avatar index={avatar} diameter={32} />
          <View className="ml-2.5 flex-1">
            <Text className="text-white text-sm font-sora-semibold leading-5">
              {username}
            </Text>
            <Text className="text-zinc-500 text-[10px] font-sora">
              @{username?.toLowerCase()}
            </Text>
          </View>
          <Pressable onPress={() => openPostMenu(item)} className="p-1.5">
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
            className="bg-card-2 rounded-xl overflow-hidden active:opacity-80 mb-3"
          >
            <View className="p-4">
              <View className="flex-row items-center mb-2">
                <BookOpen size={12} color="#fbbf24" />
                <Text className="text-amber-400/70 text-[10px] font-sora-semibold ml-1.5 uppercase tracking-widest">
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
              <Text className="text-zinc-500 text-[10px] font-sora">
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
              <Text className="text-zinc-500 text-xs ml-1.5 font-sora">
                {item.likesCount}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              router.push({
                pathname: "/(network)/post",
                params: {
                  id: item.id,
                  uid: item.uid,
                  thought: item.thought || "",
                  verseText: item.verseText || "",
                  verseReference: item.verseReference || "",
                  likesCount: item.likesCount?.toString() || "0",
                },
              });
            }}
            className="flex-row items-center mr-5"
          >
            <MessageCircle color={actionColor} size={17} />
            {item.commentsCount > 0 && (
              <Text className="text-zinc-500 text-xs ml-1.5 font-sora">
                {item.commentsCount}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const StoriesSection = () => (
    <FlatList
      data={userStories}
      renderItem={renderStory}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => item.uid || index.toString()}
      contentContainerStyle={{
        paddingVertical: 12,
      }}
    />
  );
  const TagsSection = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 8,
        marginBottom: 10,
      }}
    >
      {TAGS.map((tag) => {
        const active = selectedTag === tag;

        return (
          <Pressable
            key={tag}
            onPress={() => setSelectedTag(tag)}
            className={`mr-2 px-3.5 h-8 py-2 rounded-full ${
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
  );

  const FeedHeader = () => (
    <>
      <StoriesSection />
      <TagsSection />
    </>
  );

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
            onPress={() => router.push("/(network)/sharethought")}
            className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
          >
            <Plus color="white" size={16} />
          </Pressable>
        </View>
      </View>

      {/* Feed */}
      <View className="flex-1">
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={FeedHeader}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 140,
            flexGrow: 1,
          }}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-white/5 my-2" />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Globe size={34} color="#444" />

              <Text className="text-zinc-500 text-sm font-sora-semibold mt-4">
                No posts yet
              </Text>

              <Text className="text-zinc-600 text-center mt-2 px-10 text-xs leading-5 font-sora">
                Share a thought or scripture with the community.
              </Text>
            </View>
          }
        />
      </View>

      {/* Status Note Full View Modal */}
      <Modal visible={statusNoteModalVisible} transparent animationType="fade">
        <Pressable
          onPress={() => setStatusNoteModalVisible(false)}
          className="flex-1 bg-black/60 items-center justify-center px-8"
        >
          <Pressable
            onPress={() => {}}
            className="bg-[#1a1a1a] rounded-[28px] px-6 py-8 w-full max-w-sm"
          >
            <Text className="text-white text-lg font-sora-bold mb-4 text-center">
              Status Note
            </Text>
            <Text className="text-zinc-300 text-sm font-sora leading-7 text-center">
              "{selectedStatusNote}"
            </Text>
            <Pressable
              onPress={() => setStatusNoteModalVisible(false)}
              className="mt-6 bg-white/10 rounded-xl py-3 items-center"
            >
              <Text className="text-white/70 text-xs font-sora-semibold">
                Close
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* EDIT POST MODAL */}
      <Modal visible={!!editPost} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-sora-semibold">Edit Post</Text>
              <Pressable onPress={() => setEditPost(null)} className="p-1.5">
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Edit your post..."
              placeholderTextColor="#555"
              className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora min-h-[120px]"
            />
            <Pressable onPress={saveEditedPost} className="bg-white rounded-xl py-3.5 items-center mt-4">
              <Text className="text-black text-sm font-sora-semibold">Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}