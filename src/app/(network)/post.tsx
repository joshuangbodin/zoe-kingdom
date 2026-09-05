import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
  MoreHorizontal,
  Send,
  X,
} from "lucide-react-native";
import Avatar from "@/components/Avatar";
import {
  createCommentSmart,
  deletePostSmart,
  hasUserLikedPost,
  likePostSmart,
  subscribeToComments,
  updatePostSmart,
} from "@/libs/firebase/posts";
import { getUserProfile, UserProfile } from "@/libs/firebase/users";
import { useApp } from "@/context/app-context";
import { useToast } from "@/components/Toast";

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
  const { isOnline, user: currentUser } = useApp();
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const { showToast } = useToast();

  // Creator edit/delete
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState(thought || "");

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
    const uid = currentUser?.uid || user?.uid;
    if (!uid || !id) return;
    await likePostSmart(id, uid, isOnline);
    setIsLiked(true);
    showToast(isOnline ? "Post liked!" : "Like saved — will sync", "success");
  }, [id, showToast, isOnline, currentUser?.uid]);

  const handleComment = useCallback(async () => {
    if (!commentText.trim() || submitting || !id) return;
    const user = auth.currentUser;
    const uid = currentUser?.uid || user?.uid;
    if (!uid) {
      router.push("/(auth)/signin");
      return;
    }
    try {
      setSubmitting(true);
      const p = currentProfile || (await getUserProfile(uid));
      await createCommentSmart(
        id,
        {
          uid,
          username: p?.username || "anonymous",
          avatar: p?.avatar ?? 0,
          text: commentText.trim(),
        },
        isOnline,
      );
      setCommentText("");
      showToast(isOnline ? "Comment added!" : "Comment saved — will sync", "success");
    } catch (err) {
      console.error("Error commenting:", err);
      showToast("Failed to comment", "error");
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, id, currentProfile, isOnline, currentUser?.uid]);

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

  const isOwner = !!currentUser && currentUser.uid === uid;

  const openPostActions = useCallback(() => {
    if (!isOwner) return;
    Alert.alert("Your Post", "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => {
          setEditText(typeof thought === "string" ? thought : "");
          setEditVisible(true);
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
                if (!id) return;
                try {
                  await deletePostSmart(id, uid as string, isOnline);
                  showToast("Post deleted", "success");
                  router.back();
                } catch {
                  showToast("Could not delete post", "error");
                }
              },
            },
          ]);
        },
      },
    ]);
  }, [isOwner, id, uid, thought, isOnline, showToast]);

  const saveEdit = useCallback(async () => {
    if (!id || !editText.trim()) return;
    try {
      await updatePostSmart(id, uid as string, editText.trim(), isOnline);
      showToast("Post updated", "success");
      setEditVisible(false);
    } catch {
      showToast("Could not update post", "error");
    }
  }, [id, uid, editText, isOnline, showToast]);

  const renderComment = ({ item }: any) => (
    <View className="flex-row items-start mb-5">
      <Avatar index={item.avatar} diameter={28} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-primary text-xs font-sora-semibold">
            {item.username}
          </Text>
          <Text className="text-quaternary text-[10px] font-sora ml-2">
            {item.createdAt?.toDate
              ? new Date(item.createdAt.toDate()).toLocaleDateString()
              : ""}
          </Text>
        </View>
        <Text className="text-primary/80 text-sm font-sora leading-5">
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={top + 10}
      className="flex-1 bg-bg"
    >
      <View style={{ paddingTop: top + 10 }} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-5 pb-3 border-b border-line">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-card-2 items-center justify-center mr-3"
          >
            <ChevronLeft color="#888" size={17} />
          </Pressable>
          <Text className="text-primary text-base font-sora-semibold">Post</Text>
        </View>

        <View className="flex-1">
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
                  <View className="ml-2.5 flex-1">
                    <Text className="text-primary text-sm font-sora-semibold">
                      {author?.username || "Loading..."}
                    </Text>
                    <Text className="text-tertiary text-[10px] font-sora">
                      @{author?.username?.toLowerCase() || "..."}
                    </Text>
                  </View>
                  {isOwner && (
                    <Pressable onPress={openPostActions} className="p-1.5">
                      <MoreHorizontal size={16} color="#666" />
                    </Pressable>
                  )}
                </View>

                {/* Thought */}
                {thought && (
                  <Text className="text-primary/85 text-sm leading-6 font-sora mb-3">
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
                        <Text className="text-amber-400/70 text-[10px] font-sora-semibold ml-1.5 uppercase tracking-widest">
                          Scripture
                        </Text>
                      </View>
                      <Text className="text-primary text-sm font-serif mb-1.5">
                        {verseReference}
                      </Text>
                      <Text className="text-secondary text-[12px] leading-6 font-serif">
                        {verseText}
                      </Text>
                    </View>
                  </Pressable>
                )}

                {/* Like */}
                <View className="flex-row items-center border-t border-line pt-3">
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
                      <Text className="text-tertiary text-xs ml-1.5 font-sora">
                        {likesCount}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Comments Header */}
              <Text className="text-primary text-sm font-sora-semibold mb-4">
                Comments ({comments.length})
              </Text>
            </>
          }
          ListEmptyComponent={
            <View className="items-center pt-8">
              <Text className="text-tertiary text-xs font-sora">
                No comments yet. Be the first to share your thoughts.
              </Text>
            </View>
          }
        />

        </View>

        {/* Comment Input */}
        <View className="px-5 pb-8 pt-3 border-t border-line bg-bg">
          <View className="flex-row items-center bg-card-1 rounded-xl px-4 py-2.5">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#555"
              className="flex-1 text-primary/80 text-xs font-sora"
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

      {/* EDIT POST MODAL */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card-2 rounded-t-[32px] px-5 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-primary text-base font-sora-semibold">Edit Post</Text>
              <Pressable onPress={() => setEditVisible(false)} className="p-1.5">
                <X size={18} color="#888" />
              </Pressable>
            </View>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Edit your post..."
              placeholderTextColor="#555"
              className="bg-card-1 rounded-xl px-4 py-3.5 text-primary/90 text-sm font-sora min-h-[120px]"
            />
            <Pressable onPress={saveEdit} className="bg-white rounded-xl py-3.5 items-center mt-4">
              <Text className="text-black text-sm font-sora-semibold">Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}