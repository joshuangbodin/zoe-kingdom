import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Alert, FlatList, Pressable, Text, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plus } from "lucide-react-native";

import { auth } from "@/libs/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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

import StoriesRow from "@/components/feed/StoriesRow";
import TagFilter from "@/components/feed/TagFilter";
import PostCard, { PostCardData } from "@/components/feed/PostCard";
import FeedEmptyState from "@/components/feed/FeedEmptyState";
import StatusNoteSheet, {
  StatusNoteSheetHandle,
} from "@/components/feed/StatusNoteSheet";
import EditPostSheet, {
  EditPostSheetHandle,
} from "@/components/feed/EditPostSheet";

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
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  // Creator edit/delete state
  const [editPost, setEditPost] = useState<any>(null);

  // Bottom sheet refs
  const statusNoteSheetRef = useRef<StatusNoteSheetHandle>(null);
  const editPostSheetRef = useRef<EditPostSheetHandle>(null);

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
            setEditPost(post);
            editPostSheetRef.current?.present(post.thought || "");
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

  const saveEditedPost = useCallback(
    async (newText: string) => {
      if (!editPost) return;
      if (!newText.trim()) {
        showToast("Post can't be empty", "error");
        return;
      }
      try {
        await updatePostSmart(editPost.id, editPost.uid, newText, isOnline);
        setEditPost(null);
        showToast("Post updated", "success");
      } catch (e) {
        console.error(e);
        showToast("Could not update post", "error");
      }
    },
    [editPost, isOnline, showToast],
  );

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

  const renderPost = ({ item }: { item: PostCardData }) => {
    const isLiked = likedPosts.has(item.id);
    const userData = userCache.get(item.uid);
    const username = userData?.username ?? "anonymous";
    const avatar = userData?.avatar ?? 0;

    return (
      <PostCard
        item={item}
        isLiked={isLiked}
        username={username}
        avatar={avatar}
        onLike={() => handleLike(item.id)}
        onOpenMenu={() => openPostMenu(item)}
        onOpenVerse={openBibleVerse}
        onOpenComments={() => {
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
      />
    );
  };

  const FeedHeader = () => (
    <>
      <StoriesRow
        users={userStories}
        onSelect={(user) => statusNoteSheetRef.current?.present(user)}
      />
      <TagFilter tags={TAGS} selected={selectedTag} onSelect={setSelectedTag} />
    </>
  );

  return (
    <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-5 pb-3 border-b border-line">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Avatar index={profile?.avatar} diameter={32} />
            <Text className="text-primary text-sm font-sora-semibold ml-3">
              Zoe Network
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(network)/sharethought")}
            className="w-8 h-8 rounded-full bg-overlay items-center justify-center"
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
            paddingBottom: 140,
            flexGrow: 1,
          }}
          ListEmptyComponent={FeedEmptyState}
        />
      </View>

      {/* Bottom sheets */}
      <StatusNoteSheet ref={statusNoteSheetRef} />
      <EditPostSheet ref={editPostSheetRef} onSave={saveEditedPost} />
    </View>
  );
}